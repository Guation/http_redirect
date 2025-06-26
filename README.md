# HTTP Redirect

通常情况下我们需要访问一个http(s)网站时只需要输入域名敲下回车即可，但使用[NAT1 Traversal](https://github.com/Guation/nat1_traversal)映射出来的http(s)网站端口是随机的。

导致我们即使使用了ddns域名还是需要再携带一串端口号才能访问http(s)网站，而端口号存储在了SRV记录中。

想要从SRV记录中取得端口号也不是一件轻松的事，因为浏览器并不会去尝试解析SRV记录。

本项目使用Cloudflare的`Workers 路由`解析SRV记录并根据记录内容进行302跳转，

使得使用`NAT1 Traversal`映射出来的http网站和常见的http(s)网站一样只需要输入域名敲下回车即可访问。

当然这并不是帮你彻底隐藏端口，而是在手动输入域名的时候不需要输入端口。

彻底隐藏端口需要让流量从服务器中转，而本项目是希望让流量直达后端。

如果你希望彻底隐藏端口或者使用CDN应该使用Cloudflare Zero Trust的Tunnels功能，而不是本项目。

### 部署

1. 打开[Cloudflare](https://dash.cloudflare.com/)并登录

2. 您必须在Cloudflare托管一个域名，如果没有请按照`添加域`的引导进行托管，我们假设您托管的域为`example.com`

3. 在`计算（Workers）`中选择`Workers 和 Pages`并创建一个Worker，也可以在域的`Workers 路由`选项卡中点击`管理 Workers`跳转到`Workers 和 Pages`。

3. 在`Workers`选项卡中选择`从 Hello World! 开始`，此时无法修改`worker.js`的内容，先记住Worker的名称然后点击`部署`

4. `部署`后点击`继续去处理项目`，依次找到`设置`->`运行时`->`兼容性标志`，点击右侧编辑按钮，在兼容性标志中输入`nodejs_compat`。注意此选项无法直接在直接点击右侧下拉图标弹出的下拉框中找到，请手动输入或进行复制粘贴。输入后在下方弹出的选项框中点击`nodejs_compat`，当`nodejs_compat`被灰色小框包裹时则代表选中成功，点击右下角部署按钮。如果一切顺利兼容性标志将从`未定义标志`变更为`nodejs_compat`。

5. 在`设置`->`变量和机密`中添加一个`文本`类型，变量名称为`target`。假设您在`NAT1 Traversal`的`config.json`中设置的`domain`为`example.com`、`sub_domain`为`www-helper`，则变量值应该设置为`www-helper.example.com`，点击右下角部署按钮。

6. 如果您的后端提供的是http服务建议再添加一个`文本`类型，变量名称为`use_ip`，变量值为`true`的变量并部署。此操作是为了防止域启用了HSTS（HTTP Strict Transport Security），浏览器会将启用了HSTS的域从http请求**强制**升级为https请求，后端由于无法响应ssl握手而抛出`ERR_SSL_PROTOCOL_ERROR`，使得网站无法访问。如果您后端提供的是https服务那么不建议启用此选项，此选项会增加后端ssl证书更新负担。

7. 点击右上角`</>`图标进入`编辑代码`。将原本`worker.js`的内容**全部删除**，并将本项目`worker.js`的内容全部复制粘贴进去，然后点击`部署`。

8. 在您的域`Workers 路由`选项卡中点击`添加路由`。假设您希望使用`www.example.com`访问您的http(s)网站，您应该在`路由`中输入`www.example.com/*`，在`Worker`中选择您刚刚创建的Worker，点击保存。

9. 在您的域`DNS记录`中点击`添加记录`，类型选`A`，名称输入`www`，IPv4地址输入`8.8.8.8`或任意合法地址，代理状态`启用`。

10. 如果一切顺利，当您在浏览器输入`www.example.com`时浏览器将自动跳转到`www-helper.example.com:xxxx/`。
