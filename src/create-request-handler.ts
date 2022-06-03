import type { Response as NodeResponse } from "@remix-run/node";
import {
  Headers as NodeHeaders,
  Request as NodeRequest,
} from "@remix-run/node";
import { installGlobals } from "@remix-run/node";
import type { AppLoadContext, ServerBuild } from "@remix-run/server-runtime";
import { createRequestHandler as createRemixRequestHandler } from "@remix-run/server-runtime";
import type {
  CloudFrontHeaders,
  CloudFrontRequestEvent,
  CloudFrontRequestHandler,
} from "aws-lambda";
import { URL } from "url";

installGlobals();

export interface GetLoadContextFunction {
  (event: CloudFrontRequestEvent): AppLoadContext;
}

export type RequestHandler = ReturnType<typeof createRequestHandler>;

export type RequestHandlerConfig = {
  build: ServerBuild;
  getLoadContext?: GetLoadContextFunction;
  mode?: string;
};

export function createRequestHandler({
  build,
  getLoadContext,
  mode = process.env.NODE_ENV,
}: RequestHandlerConfig): CloudFrontRequestHandler {
  const handleRequest = createRemixRequestHandler(build, mode);

  return async (event, _context) => {
    const request = createRemixRequest(event);

    const loadContext =
      typeof getLoadContext === "function" ? getLoadContext(event) : undefined;

    const response = (await handleRequest(
      request as unknown as Request,
      loadContext,
    )) as unknown as NodeResponse;

    return {
      status: String(response.status),
      headers: createCloudFrontHeaders(response.headers),
      bodyEncoding: "text",
      body: await response.text(),
    };
  };
}

function createCloudFrontHeaders(
  responseHeaders: NodeHeaders,
): CloudFrontHeaders {
  const headers: CloudFrontHeaders = {};
  const rawHeaders = responseHeaders.raw();

  for (const key in rawHeaders) {
    const value = rawHeaders[key];
    for (const v of value) {
      headers[key] = [...(headers[key] || []), { key, value: v }];
    }
  }

  return headers;
}

function createRemixHeaders(requestHeaders: CloudFrontHeaders): NodeHeaders {
  const headers = new NodeHeaders();

  for (const [key, values] of Object.entries(requestHeaders)) {
    for (const { value } of values) {
      if (value) {
        headers.append(key, value);
      }
    }
  }

  return headers;
}

function createRemixRequest(event: CloudFrontRequestEvent): NodeRequest {
  const request = event.Records[0].cf.request;

  const host = request.headers["host"]
    ? request.headers["host"][0].value
    : undefined;
  const search = request.querystring.length ? `?${request.querystring}` : "";
  const url = new URL(request.uri + search, `https://${host}`);

  return new NodeRequest(url.toString(), {
    method: request.method,
    headers: createRemixHeaders(request.headers),
    body: request.body?.data
      ? request.body.encoding === "base64"
        ? Buffer.from(request.body.data, "base64").toString()
        : request.body.data
      : undefined,
  });
}
