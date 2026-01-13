// #!/bin/env node
// -*- coding:utf-8 -*-

// https://github.com/Guation/http_redirect
// https://edgeone.cloud.tencent.com/pages/document/184787642236784640

// __author__ = "Guation"
// __version__ = "1.0.1"

import dns from "node:dns";

export default async function onRequest(context) {
    if (context.env.target) {
      return new Response("请为pages添加一个名为“target”的变量，并将变量值设为需要解析SRV记录的域名地址。");
    }
    let srvName = `_web._tcp.${context.env.target}.`;
    try {
      let srvRecords = await dns.promises.resolve(srvName, "SRV");
      if (!srvRecords || srvRecords.length === 0) {
        return new Response("SRV记录不存在。", { status: 400 });
      }
      let selectedRecord = srvRecords[0];
      let targetUrl = new URL(context.request.url);
      if (context.env.use_ip == "true") {
        let aRecords = await dns.promises.resolve(selectedRecord.name, "A");
        if (!aRecords || aRecords.length === 0) {
          return new Response("SRV记录指向的A记录不存在。", { status: 400 });
        }
        targetUrl.hostname = aRecords[0];
      } else {
        targetUrl.hostname = selectedRecord.name;
      }
      if (context.env.protocol == "http" || context.env.protocol == "https") targetUrl.protocol = context.env.protocol;
      targetUrl.port = selectedRecord.port;
      return Response.redirect(targetUrl.href, 302);
    } catch (err) {
      return new Response(`Error: ${err.message}`, { status: 400 });
    }
}
