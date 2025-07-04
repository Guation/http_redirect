#!/bin/env node
// -*- coding:utf-8 -*-

// https://github.com/Guation/http_redirect
// https://developers.cloudflare.com/workers/

// __author__ = "Guation"
// __version__ = "1.0.1"

import dns from "node:dns";

export default {
  async fetch(request, env, ctx) {
    if (env.target) {
      let srvName = "_web._tcp." + env.target + ".";
      try {
        let srvRecords = await dns.promises.resolve(srvName, "SRV");
        if (!srvRecords || srvRecords.length === 0) {
          return new Response("SRV记录不存在。", { status: 500 });
        }
        let selectedRecord = srvRecords[0];
        let targetUrl = new URL(request.url);
        if (env.use_ip == "true") {
          let aRecords = await dns.promises.resolve(selectedRecord.name, "A");
          if (!aRecords || aRecords.length === 0) {
            return new Response("SRV记录指向的A记录不存在。", { status: 500 });
          }
          targetUrl.hostname = aRecords[0];
        } else {
          targetUrl.hostname = selectedRecord.name;
        }
        targetUrl.port = selectedRecord.port;
        return Response.redirect(targetUrl.href, 302);
      } catch (err) {
        return new Response(`Error: ${err.message}`, { status: 500 });
      }
    } else {
      return new Response("请为worker添加一个名为“target”的纯文本类型的变量，并将记录值设为需要解析SRV记录的域名地址。");
    }
  },
};
