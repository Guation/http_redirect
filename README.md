# HTTP Redirect

通常情况下我们需要访问一个http(s)网站时只需要输入域名敲下回车即可，但使用[NAT1 Traversal](https://github.com/Guation/nat1_traversal)映射出来的http(s)网站端口是随机的。

导致我们即使使用了ddns域名还是需要再携带一串端口号才能访问http(s)网站，而端口号存储在了SRV记录中。

想要从SRV记录中取得端口号也不是一件轻松的事，因为浏览器并不会去尝试解析SRV记录。

本项目使用一些CDN厂家提供的边缘函数，通过脚本解析SRV记录并根据记录内容进行302跳转，

> - Cloudflare的`Workers 路由`
> - 腾讯云EdgeOne的`Pages`
> - 阿里云ESA的`函数和 Pages`

使得使用`NAT1 Traversal`映射出来的http网站和常见的http(s)网站一样只需要输入域名敲下回车即可访问。

当然这并不是帮你彻底隐藏端口，而是在手动输入域名的时候不需要输入端口。

彻底隐藏端口需要让流量从服务器中转，而本项目是希望让流量直达后端。

如果你希望隐藏源站可以尝试以下项目。

- [腾讯云EdgeOne](https://github.com/Guation/EdgeOneUpdate)
- 阿里云ESA
- Cloudflare Zero Trust的Tunnels

### 部署

#### Cloudflare Workers

1. 打开[Cloudflare](https://dash.cloudflare.com/)并登录

2. 您必须在Cloudflare托管一个域名，如果没有请按照`添加域`的引导进行托管，我们假设您托管的域为`example.com`

3. 在`计算（Workers）`中选择`Workers 和 Pages`并创建一个Worker，也可以在域的`Workers 路由`选项卡中点击`管理 Workers`跳转到`Workers 和 Pages`。

3. 在`Workers`选项卡中选择`从 Hello World! 开始`，此时无法修改`worker.js`的内容，先记住Worker的名称然后点击`部署`

4. `部署`后点击`继续去处理项目`，依次找到`设置`->`运行时`->`兼容性标志`，点击右侧编辑按钮，在兼容性标志中输入`nodejs_compat`。注意此选项无法直接在直接点击右侧下拉图标弹出的下拉框中找到，请手动输入或进行复制粘贴。输入后在下方弹出的选项框中点击`nodejs_compat`，当`nodejs_compat`被灰色小框包裹时则代表选中成功，点击右下角部署按钮。如果一切顺利兼容性标志将从`未定义标志`变更为`nodejs_compat`。

5. 在`设置`->`变量和机密`中添加一个`文本`类型，变量名称为`target`。假设您在`NAT1 Traversal`的`config.json`中设置的`domain`为`example.com`、`sub_domain`为`www-helper`，则变量值应该设置为`www-helper.example.com`，点击右下角部署按钮。

6. 程序默认使用http/https协议跟随，但是后端协议与访问workers时的协议可能并不一致，造成无法访问的问题，建议再添加一个`文本`类型，变量名称为`protocol`，变量值为`http`或者`https`的变量并部署。

7. 如果您的后端提供的是http服务建议再添加一个`文本`类型，变量名称为`use_ip`，变量值为`true`的变量并部署。此操作是为了防止您的域启用了或曾经启用过HSTS（HTTP Strict Transport Security），浏览器会将具有HSTS标记的域从http请求**强制**升级为https请求，后端由于无法响应ssl握手而抛出`ERR_SSL_PROTOCOL_ERROR`，使得网站无法访问。如果您后端提供的是https服务那么不建议启用此选项，此选项会增加后端ssl证书更新负担。

8. 点击右上角`</>`图标进入`编辑代码`。将原本`worker.js`的内容**全部删除**，并将本项目`cloudflare_worker.js`的内容全部复制粘贴进去，然后点击`部署`。

9. 在您的域`Workers 路由`选项卡中点击`添加路由`。假设您希望使用`www.example.com`访问您的http(s)网站，您应该在`路由`中输入`www.example.com/*`，在`Worker`中选择您刚刚创建的Worker，点击保存。

10. 在您的域`DNS记录`中点击`添加记录`，类型选`A`，名称输入`www`，IPv4地址输入`8.8.8.8`或任意合法地址，代理状态`启用`。

11. 如果一切顺利，当您在浏览器输入`www.example.com`时浏览器将自动跳转到`www-helper.example.com:xxxx/`。

#### 腾讯云EdgeOne Pages

1. 打开EdgeOne[国内版](https://console.cloud.tencent.com/edgeone/pages)或[海外版](https://console.tencentcloud.com/edgeone/pages)并登录

2. 下载本项目[源码](https://github.com/Guation/http_redirect/archive/refs/heads/main.zip)并解压。

3. 点击`创建项目`->`直接上传`，为项目设置为一个名称（5到63个字符，只能包含小写字母、数字和连字符，并且不能以连字符开头或结尾），选择`全球可用区（不包含中国大陆）`，点击`选择文件夹`导航找到解压出来的本项目中的`edgeone_page`文件夹

4. 点击创建好的项目，点击`项目设置`。找到`环境变量`->`新增环境变量`。变量名称为`target`。假设您在`NAT1 Traversal`的`config.json`中设置的`domain`为`example.com`、`sub_domain`为`www-helper`，则变量值应该设置为`www-helper.example.com`，点击确定按钮。

5. 程序默认使用http/https协议跟随，但是后端协议与访问pages时的协议可能并不一致，造成无法访问的问题，建议再添加一个变量名称为`protocol`，变量值为`http`或者`https`的变量并部署。

6. 如果您的后端提供的是http服务建议再添加一个变量名称为`use_ip`，变量值为`true`的变量。此操作是为了防止您的域启用了或曾经启用过HSTS（HTTP Strict Transport Security），浏览器会将具有HSTS标记的域从http请求**强制**升级为https请求，后端由于无法响应ssl握手而抛出`ERR_SSL_PROTOCOL_ERROR`，使得网站无法访问。如果您后端提供的是https服务那么不建议启用此选项，此选项会增加后端ssl证书更新负担。

7. 由于环境变量变更只在部署时生效，设置好环境变量后还需要点击`构建部署`->`新建部署`->`选择文件夹`导航找到解压出来的本项目中的`edgeone_page`文件夹重新上传一次部署

8. 点击`项目设置`->`域名管理`->`添加自定义域名`，按照提示输入您的域名，假设您输入的域名为`www.example.com`，按照提示在域名所托管的DNS供应商处添加一条CNAME解析并进行验证。

9. 如果一切顺利，当您在浏览器输入`www.example.com`时浏览器将自动跳转到`www-helper.example.com:xxxx/`。

#### 阿里云ESA 函数和 Pages

1. 打开ESA[国内版](https://esa.console.aliyun.com/)并登录

2. 登录完成后按照提示开通`ESA`业务并添加一个站点，输入您需要绑定的域名，假设您输入的域名为`example.com`，按照引导验证域名所有权并开通免费版订阅，推荐选择`CNAME`接入方式，这样不需要将域名托管到阿里云

3. 打开[函数和 Pages](https://esa.console.aliyun.com/edge/pages/list)页面

4. 点击`创建`->`函数模板`->`Hello World`->`下一步`，此时无法修改代码，先记住函数名称然后点击`提交`，提交后点击`去列表查看`

5. 找到刚刚创建好的函数名称，点击进入函数详情页，点击`代码`进入代码修改页，将原本内容**全部删除**，并将本项目`esa_page.js`的内容全部复制粘贴进去，鼠标滑轮滚动到代码头部。

6. 假设您在`NAT1 Traversal`的`config.json`中设置的`domain`为`example.com`、`sub_domain`为`www-helper`，则将常量`target`的值设置为`www-helper.example.com`。

7. 程序默认使用http/https协议跟随，但是后端协议与访问函数时的协议可能并不一致，造成无法访问的问题，建议将常量`protocol`的值设置为`http`或者`https`。

8. 如果您的后端提供的是http服务建议将常量`use_ip`的值由`false`修改为`true`。此操作是为了防止您的域启用了或曾经启用过HSTS（HTTP Strict Transport Security），浏览器会将具有HSTS标记的域从http请求**强制**升级为https请求，后端由于无法响应ssl握手而抛出`ERR_SSL_PROTOCOL_ERROR`，使得网站无法访问。如果您后端提供的是https服务那么不建议启用此选项，此选项会增加后端ssl证书更新负担。

9. 点击`快速发布`按钮。

10. 点击`域名`->`添加域名`，假设您输入的域名为`www.example.com`，点击`确定`。

11. 点击`查看 DNS 记录`，在`边缘函数`中，域名`www.example.com`的`CNAME 状态`显示为`待配置`，鼠标移动到`待配置`上，在弹出的悬浮框中点击`打开配置向导`，按照提示在域名所托管的DNS供应商处添加一条CNAME解析并点击`查询`按钮。

12. 如果一切顺利，当您在浏览器输入`www.example.com`时浏览器将自动跳转到`www-helper.example.com:xxxx/`。
