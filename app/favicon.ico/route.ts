export function GET(request: Request) {
  const redirectUrl = new URL("/icons/icon.svg", request.url);
  return Response.redirect(redirectUrl, 308);
}
