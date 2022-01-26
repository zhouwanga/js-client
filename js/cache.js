/*
 * @Author: Mr.Zhan YiDong
 * @Date: 2022-01-25 17:18:52
 * @Last Modified by: Mr.Zhan YiDong
 * @Last Modified time: 2022-01-26 09:53:38
 */
; (function () {
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