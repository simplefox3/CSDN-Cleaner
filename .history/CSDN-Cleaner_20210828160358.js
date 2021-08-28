// ==UserScript==
// @name         CSDN-Cleaner|下载页面移除|百度搜索csdn结果优化
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  1.进入CSDN下载界面自动关闭 2.CSDN博客文章界面下推荐中有关csdn下载的链接清除 3.百度搜索界面清除CSDN下载和聚合内容的搜索结果
// @author       Exisi
// @match        https://download.csdn.net/*
// @match        http://download.csdn.net/*
// @match        https://blog.csdn.net/*
// @match        *://m.baidu.com/*
// @match        *://www.baidu.com/*
// @grant        none
// @supportURL   https://github.com/Exisi/CSDN-Cleaner/issues/new
// ==/UserScript==

(function () {

    let url = window.location.href;

    if (url.match(/download.csdn/)) { //不予许浏览器打开csdn相关下载界面
        csdnClose(); //需要使用csdn下载界面可以删除
    }

    if (url.match(/blog.csdn/)) { //清除csdn推荐内的csdn下载链接
        window.onload = function () {
            csdnItemRemove(); //防js诈尸
        }
        let itemList = document.getElementsByClassName("recommend-item-box type_download clearfix");
        if (itemList != null) {
            for (let i in itemList) {
                itemList[i].style.display = "none";
            }
        }
    }

    if (url.match(/baidu.com/)) { //清除baidu搜索界面的所有csdn下载链接
        let nodeList = document.getElementsByClassName("result c-container new-pmd");
        let textList = [];
        if (nodeList != null) {
            for (let i in nodeList) {
                const t = nodeList[i].textContent;
                if (t != null) {
                    if (t.search(/(CSDN下载是一个提供学习资源)|(下载资源请访问CSDN下载)|(C币\s+立即)|(立即下载\s+低至)|(csdn已为您找到关于)/g) > 0) { //暴力检索
                        nodeList[i].style.display = "none";
                    }
                }
                if (nodeList[i].nodeType == 1) {
                    let itemNode = nodeList[i].getElementsByClassName("c-abstract")[0];
                    if (itemNode != null) {
                        let text = itemNode.textContent;
                        let t = text.slice(text.indexOf("日") + 1).replaceAll(" ", "").replaceAll(".", "") //去除csdn文章前的日期描述
                        textList.push(t); //获取每个搜索结果的小字描述,并加入列表
                        // console.log(t);
                    }
                }
            }
            sameBlogRemove(nodeList, textList); //清除baidu搜索所有可能重复的结果
        }
    }


    /*---------------------------(*･∀･)／函数分割线＼(･∀･*)---------------------------*/
    function sameBlogRemove(nodeList, textList) {
        try {
            for (let i in textList) {
                for (let j in textList) {
                    if (i != j) {
                        if (compare(textList[i], textList[j])) {
                            let key = nodeList[i].textContent.search("CSDN技术社区") > 0 ? i : j; //优先干掉csdn（￣へ￣）
                            // console.log("csdn?:key:===>"+key+"item:"+i);
                            textList[key] = ""; //清空移除的搜索结果
                            nodeList[key].style.display = "none"; 
                            continue;
                        }
                    }
                }
            }
        } catch (error) {
            // console.log(error);//search()参数为空的报错，问题不大忽略
        }
    }

    function compare(str1, str2) { //寻找相同字符 
        if (str1 == str2) return true; //完全匹配

        if (str1.search(str2.slice(1)) > 0) { //残缺匹配
            return true;
        } else {
            return false;
        }
    }


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


    function csdnClose() {
        if (window.history.length > 1) { //当前标签页打开后退
            window.history.back();
        } else { //新标签页打开直接关闭
            window.close();
        }
    }
})();