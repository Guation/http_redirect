// #!/bin/env node
// -*- coding:utf-8 -*-

// https://github.com/Guation/http_redirect
// https://edgeone.cloud.tencent.com/pages/document/184787642236784640

// __author__ = "Guation"
// __version__ = "1.0.1"

import index_onRequest from "./index";

export default async function onRequest(context) {
    return await index_onRequest(context);
}
