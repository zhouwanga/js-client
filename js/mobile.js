/*
 * @Author: Mr.Zhan YiDong
 * @Date: 2022-01-25 17:18:52
 * @Last Modified by: Mr.Zhan YiDong
 * @Last Modified time: 2022-01-26 09:53:38
 */
; (function () {
  let url = window.location.pathname // url地址
  let regText = new RegExp(/mobile.html/) // 匹配移动端正则
  let winWidth = document.body.clientWidth // 屏幕可视宽度
  if ('ontouchend' in document.body) {// 是否为移动端
    if (!regText.test(url)) {
      window.location.href = "/index-mobile.html"
      return;
    }
    // 配置移动端样式
    let domConsole = document.getElementById("console")
    domConsole.style.cssText = "width:" + winWidth + "px;height:100%;min-height:1500px;border:none" + domConsole.style.cssText
    let hideDom = document.getElementsByClassName("toolMobile")
    for (let item of hideDom) {
      item.style.display = "none"
    }
  } else {
    // pc端
    if (regText.test(url)) {
      window.location.href = "/index.html"
      return;
    }
  }
  // 从缓存种读取上一次的nickName
  let lastName = window.localStorage.getItem("userName")
  document.getElementById("input").value = lastName ? lastName : ""
  // 保存input框的用户名
  document.getElementById("input").addEventListener("keypress", function (event) {
    let isInit = false
    if (event.keyCode != 13 || isInit) {
      return
    }
    isInit = true
    window.localStorage.setItem("userName", document.getElementById("input").value)
  }, false);
})()