// CloudFront Functions (viewer request)
// S3 REST 엔드포인트는 하위 폴더의 index.html을 자동으로 찾아 주지 않는다.
// Next.js 정적 export(trailingSlash)는 /private/ → private/index.html 로 파일을 만들므로 경로를 맞춰 준다.
// www.<도메인>으로 들어오면 루트 도메인으로 301 리다이렉트해 주소를 하나로 통일한다.
function handler(event) {
  var request = event.request;
  var uri = request.uri;
  var host = request.headers.host ? request.headers.host.value : "";

  if (host.indexOf("www.") === 0) {
    var qs = Object.keys(request.querystring)
      .map(function (k) {
        var v = request.querystring[k].value;
        return v === "" ? k : k + "=" + v;
      })
      .join("&");
    return {
      statusCode: 301,
      statusDescription: "Moved Permanently",
      headers: {
        location: { value: "https://" + host.substring(4) + uri + (qs ? "?" + qs : "") },
      },
    };
  }

  if (uri.endsWith("/")) {
    request.uri = uri + "index.html";
  } else if (uri.split("/").pop().indexOf(".") === -1) {
    // 확장자 없는 경로(/private) → /private/index.html
    request.uri = uri + "/index.html";
  }

  return request;
}
