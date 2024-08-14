import { NextApiRequest, NextApiResponse } from "next";
import { NextRequest, NextResponse } from "next/server";

export type ResponseData = {
    message: string
}

export type ResponseDataParam = ResponseData & {
    status: number,
}

export function createResponseInvalid(req: NextRequest, msg?: string): NextResponse<ResponseData> {
    console.log("Invalid request: " + msg + " Request: " + req)
    return new NextResponse(JSON.stringify({ message: "Invalid request", error: "Invalid request" }), { status: 400 })
}

export function createResponseUnauthorized(req: NextRequest): NextResponse<ResponseData> {
    console.log("Unauthorized request: " + req)
    return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
}

export function createResponseInvalidTransparent(req: NextRequest, msg: string): NextResponse<ResponseData> {
    return createResponseInvalidTransparentWithStatus(req, { message: msg, status: 400 });
}

export function createResponseInvalidTransparentWithStatus(req: NextRequest, resp: ResponseDataParam): NextResponse<ResponseData> {
    console.log("Invalid request: " + resp.message + " Request: " + req)
    return new NextResponse(JSON.stringify({ message: resp.message }), { status: resp.status });
}

export function checkIsPost(req: NextRequest): NextResponse<ResponseData> | null {
    if (req.method !== 'POST') {
        return createResponseInvalid(req, "POST required.")
    }

    return null
}

export function checkSlugLength(req: NextRequest, expected: number, slug?: string[]): NextResponse<ResponseData> | null {
    if (slug == undefined || slug.length < expected) {
        return createResponseInvalid(req, "Request is invalid.");
    }

    return null;
}


export function checkHasParams(req: NextRequest, ...value: any): NextResponse<ResponseData> | null {
    for (const val of value) {
        if (val == undefined || val == null) {
            return createResponseInvalid(req, "Parameters missing.")
        }
    }

    return null;
}

export function createResponseValid(req: NextRequest, send?: any): NextResponse<ResponseData> {
    const response: any = send || { message: 'Success' }
    console.log("Valid request: " + req + " Response: " + response);
    return new NextResponse(JSON.stringify(response), { status: 200 });
}