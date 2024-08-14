export function getRequestHeader(method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH", e?: any): RequestInit {
  return {
    method: method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: e == undefined ? undefined : JSON.stringify(e),
  };
}