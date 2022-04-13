// ==UserScript==
// @name         CSDN-Cleaner|下载页面移除|百度搜索csdn结果优化
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  1.进入CSDN下载界面自动关闭 2.CSDN博客文章界面下推荐中有关csdn下载的链接清除 3.百度搜索界面清除CSDN下载和聚合内容的搜索结果 4.百度界面搜索结果/相同文章去重 5.对 CSDN 文章原创 / 转载突出标识 6.增加界面表格获取按钮，对csdn博客中的表格进行获取重绘，复制格式不混乱 7.防百度预加载干扰
// @author       Exisi
// @match        https://download.csdn.net/*
// @match        http://download.csdn.net/*
// @match        https://blog.csdn.net/*
// @match        *.blog.csdn.net/article/*
// @match        *://www.baidu.com/s*
// @supportURL   https://github.com/Exisi/CSDN-Cleaner/issues/new
// ==/UserScript==

(function () {
    let url = window.location.href;
    if (url.match(/download.csdn/)) csdnClose(); //需要使用csdn下载界面可以删除
    if (url.match(/blog.csdn/)) {
        //重新标识原创和转载标签
        let copyright = document.getElementsByClassName("article-copyright")[0] ? 1 : 0;
        let tagNode = document.getElementsByClassName("article-bar-top")[0];
        if (tagNode != null) {
            if (copyright == 1) {
                csdnCreateNewTag(tagNode, "原创", "red");
            } else {
                csdnCreateNewTag(tagNode, "转载", "green");
            }
        }
        //获取表格节点
        let table_node = document.getElementsByClassName("table-box");
        //加入表格格式绘制按钮，用于复制到word或笔记
        if (table_node[0] != null) reRormatTable(table_node);
        //删除底部文章推荐中的 csdn下载
        let itemList = document.getElementsByClassName("recommend-item-box type_download clearfix");
        if (itemList != null) {
            for (let i in itemList) {
                if (itemList[i].style != null) {
                    itemList[i].style.display = "none";
                }
            }
        }
        //防csdn下载js再次加入
        window.onload = function () {
            csdnItemRemove();
        }
    }

    if (url.match(/baidu.com/)) {
        baiduDiabledPreload();
        let textList = [];
        let model = baiduSearchModel();
        let nodeList = document.getElementsByClassName("result c-container new-pmd");

        if (nodeList != null) {
            for (let i in nodeList) {
                const t = nodeList[i].textContent;
                if (t != null && t.search(/(CSDN下载是一个提供学习资源)|(请访问CSDN下载)|(C币\s+立即)|(立即下载\s+低至)|(csdn已为您找到关于)|(次\s+身份认)|(积分\/\C币)/g) > 0) { //暴力检索
                    //清除baidu搜索界面的所有csdn下载链接
                    nodeList[i].style.display = "none";
                }
                let text = getNodeText(model, nodeList[i]);
                if (text != null) textList.push(text);
            }
            //清除baidu搜索所有可能重复的结果
            if (model > 0) sameBlogRemove(nodeList, textList);
        }
    }


    /*---------------------------(*･∀･)／函数分割线＼(･∀･*)---------------------------*/


    //取消百度的预加载
    function baiduDiabledPreload() {
        let page_btn = document.getElementsByClassName("page-inner_2jZi2")[0].getElementsByTagName("a");
        if (page_btn != null) {
            for (let i in page_btn) {
                if (page_btn[i] != null) {
                    page_btn[i].onclick = function () {
                        setTimeout("location.reload()", 100);
                    }
                }
            }
        }
        let submit_btn = document.getElementsByClassName("bg s_btn_wr")[0];
        if (submit_btn != null) {
            submit_btn.onclick = function () {
                setTimeout("location.reload()", 500);
            }
        }
    }

    //在搜题的情况下对搜索结果不进行处理
    function baiduSearchModel() {
        let content = document.getElementsByClassName("f13 c-gap-top-xsmall se_st_footer user-avatar");
        let model = 0;
        if (content != null) {
            for (let i in content) {
                if (content[i].textContent != null) {
                    model = content[i].textContent.indexOf("百度题库") > -1 ? 0 : 1;
                    if (model == 0) break;
                    model = content[i].textContent.indexOf("百度文库") > -1 ? 0 : 1;
                    if (model == 0) break;
                }
            }
            return model; //搜题0 , 默认1
        }
    }

    //获取每个搜索结果的文本
    function getNodeText(model, node) {
        if (model > 0 && node.nodeType == 1) {
            let itemNode = node.getElementsByClassName("c-abstract")[0];
            if (itemNode != null) {
                let text = itemNode.textContent;
                let t = text.slice(text.indexOf("日") + 1).replaceAll(" ", "").replaceAll(".", "") //去除csdn文章前的日期描述
                return t; //返回每个搜索项的文本
            }
        }
    }

    //对重复的博客进行去除
    function sameBlogRemove(nodeList, textList) {
        for (let i in textList) {
            for (let j in textList) {
                if (i != j && compare(textList[i], textList[j])) {
                    let key = nodeList[i].textContent.search(/CSDN技术社区/g) > 0 ? i : j; //优先干掉csdn（￣へ￣）
                    // console.log("csdn?:key:===>"+key+"item:"+i);
                    //清空移除的搜索结果
                    textList[key] = "";
                    nodeList[key].style.display = "none";
                    continue;
                }
            }
        }
    }

    //寻找相同字符
    function compare(str1, str2) {
        //完全匹配
        if (str1 == str2) return true;
        //残缺匹配
        if (str1.indexOf(str2.slice(1)) > 0) {
            return true;
        } else {
            return false;
        }
    }

    //移除推荐文章中的csdn下载
    function csdnItemRemove() {
        let errorItemList = document.getElementsByClassName("recommend-item-box baiduSearch clearfix");
        if (errorItemList != null) {
            for (let i = 0; i < errorItemList.length; i++) {
                let link = errorItemList[i].getElementsByTagName("a")[0].href;
                if (link.match(/download.csdn/)) {
                    errorItemList[i].style.display = "none";
                }
            }
        }
    }

    //表格格式化
    function reRormatTable(table_node) {
        for (let i in table_node) {
            if (table_node[i] != null && table_node[i].nodeType != null) {
                //查看按钮
                var btn = document.createElement("input");
                btn.setAttribute("type", "button");
                btn.setAttribute("value", "获取表格");
                btn.setAttribute("class", "btn_table");
                btn.style.background = "black";
                btn.style.marginTop = "5px";
                btn.style.color = "white";
                btn.style.padding = "6px";
                btn.style.fontWeight = "600";
                btn.style.borderRadius = "4px";
                btn.style.fontSize = "14px";
                btn.addEventListener("click", function () {
                    let table_content = table_node[i].innerHTML;
                    window.document.write(table_content); //只显示表格
                    document.getElementsByClassName("btn_table")[0].style.display = "none";

                    document.getElementsByTagName("table")[0].style.border = "1px solid #000";
                    document.getElementsByTagName("table")[0].style.borderCollapse = "collapse";
                    //绘制表头
                    let title = document.getElementsByTagName("tr")[0];
                    if (title.style != null) {
                        title.style.backgroundColor = "black";
                        title.style.color = "white";

                        let title_th = title.getElementsByTagName("th");
                        if (title_th != null) {
                            for (const i in title_th) {
                                if (title_th[i].style != null) {
                                    title_th[i].style.border = "solid #ccc 1px"; //强制绘制边框
                                }
                            }
                        }

                        let title_td = title.getElementsByTagName("td");
                        if (title_td != null) {
                            for (const i in title_td) {
                                if (title_td[i].style != null) {
                                    title_td[i].style.backgroundColor = "black";
                                    title_td[i].style.color = "white";
                                    title_td[i].style.border = "solid #ccc 1px"; //强制绘制边框
                                }
                            }
                        }
                    }
                    //绘制行
                    let item = document.getElementsByTagName("tr");
                    for (let t in item) {
                        if (item[t] != null && item[t].nodeType != null) {
                            let all_item = item[t].getElementsByTagName("td");
                            for (const j in all_item) {
                                if (all_item[j].style != null) {
                                    all_item[j].style.border = "solid #ccc 1px"; //强制绘制边框
                                }
                            }
                            if (t > 0 && t % 2 == 0) {
                                let second_item = item[t].getElementsByTagName("td");
                                for (const j in second_item) {
                                    if (second_item[j].style != null) {
                                        second_item[j].style.backgroundColor = "#e7e6e6"; //奇数表格显色
                                    }
                                }
                            }
                        }
                    }
                })
                table_node[i].appendChild(btn);
            }
        }
    }

    //替换文章标签
    function csdnCreateNewTag(tagNode, type, color) {
        let tag = tagNode.getElementsByClassName("article-type-img")[0];
        let preTag = document.getElementsByClassName("blog-tags-box")[0];
        if (tag != null && preTag != null) {
            tag.style.display = "none";
            let newTag = document.createElement("div");
            newTag.innerHTML += "<div id='taga_content' style='background:white;height:35px;width:35px;border-radius:5px;border:1px solid " + color + ";transform: rotate(-45deg);display:flex;justify-content:center;align-items:center;margin-right:20px;margin-left:-25px;'><button id='new_tag' style='background:none;color:" + color + ";transform:rotate(45deg);text-align: center;display: inline-block;font-size:12px;padding:2px;'>" + type + "</button></div>";
            preTag.prepend(newTag);
            let nextTagContent = document.getElementsByClassName("tags-box artic-tag-box")[0];
            if (nextTagContent != null) nextTagContent.style.paddingTop = "6px";
            let btn_tag = document.getElementById("new_tag");
            btn_tag.addEventListener("click", function () {
                let link = document.createElement("a");
                link.setAttribute("href", "#pcCommentBox");
                link.click();
            });
        }
    }

    //关闭csdn下载界面
    function csdnClose() {
        if (window.history.length > 1) {
            //当前标签页打开后退
            window.history.back();
        } else {
            //新标签页打开直接关闭
            window.close();
        }
    }
})();
