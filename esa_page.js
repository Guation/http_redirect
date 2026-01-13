#!/bin/env node
// -*- coding:utf-8 -*-

// https://github.com/Guation/http_redirect
// https://help.aliyun.com/zh/edge-security-acceleration/esa/user-guide/api-documentation/

// __author__ = "Guation"
// __version__ = "1.0.0"

const target = ""; // 在双引号内填入域名 注意不要删除引号 也不要填入空格或其他多余符号
const protocol = ""; // 可选值 http https
const use_ip = "false"; // 可选值 true false

async function dohResolve(name, type) {
  const url = `https://dns.alidns.com/resolve?name=${encodeURIComponent(name)}&type=${type}`;
  const res = await fetch(url, {
    headers: { "accept": "application/dns-json" },
  });
  if (!res.ok) {
    throw new Error(`DoH 请求失败: ${res.status}`);
  }
  const data = await res.json();
  if (data.Status !== 0 || !data.Answer) {
    return [];
  }
  return data.Answer;
}

function parseSRV(data) {
  const [priority, weight, port, host] = data.split(" ");
  return {name: host.endsWith(".") ? host.slice(0, -1) : host, port: port}
}

export default {
  async fetch(request) {
    if (!target) {
      return new Response("请修改脚本头部target常量，填入需要解析SRV记录的域名地址。");
    }
    let srvName = `_web._tcp.${target}.`;
    try {
      let srvRecords = await dohResolve(srvName, "SRV");
      if (srvRecords.length === 0) {
        return new Response("SRV记录不存在。", { status: 400 });
      }
      let selectedRecord = parseSRV(srvRecords[0].data);
      let targetUrl = new URL(request.url);
      if (use_ip == "true") {
        let aRecords = await dohResolve(selectedRecord.name, "A");
        if (aRecords.length === 0) {
          return new Response("SRV记录指向的A记录不存在。", { status: 400 });
        }
        targetUrl.hostname = aRecords[aRecords.length-1].data;
      } else {
        targetUrl.hostname = selectedRecord.name;
      }
      if (protocol == "http" || protocol == "https") targetUrl.protocol = protocol;
      targetUrl.port = selectedRecord.port;
      return Response.redirect(targetUrl.href, 302);
    } catch (err) {
      return new Response(`Error: ${err.message}`, { status: 400 });
    }
  },
};
