/**************************************************
 * MKOnlinePlayer v2.4
 * Ajax 后台数据交互请求模块
 * 编写：mengkun(https://mkblog.cn)
 * 时间：2018-3-11
 *************************************************/

// ajax加载搜索结果
function ajaxSearch() {
    if(rem.wd === ""){
        layer.msg('搜索内容不能为空', {anim:6});
        return false;
    }
    
    if(rem.loadPage == 1) { // 弹出搜索提示
        var tmpLoading = layer.msg('搜索中', {icon: 16,shade: 0.01});
    }

    $.ajax({
        type: mkPlayer.method, 
        url: mkPlayer.searchSong,
        data: "rn=" + mkPlayer.loadcount + "&pn=" + (rem.loadPage - 1) + "&keyword=" + urlEncode(rem.wd),
        dataType : "json",
        complete: function(XMLHttpRequest, textStatus) {
            if(tmpLoading) layer.close(tmpLoading);    // 关闭加载中动画
        },  // complete
        success: function(jsonData){
            
            // 调试信息输出
            if(mkPlayer.debug) {
                console.debug("搜索结果数：" + jsonData.length);
            }
            
            if(rem.loadPage == 1)   // 加载第一页，清空列表
            {
                if(jsonData.length === 0)   // 返回结果为零
                {
                    layer.msg('没有找到相关歌曲', {anim:6});
                    return false;
                }
                musicList[0].item = [];
                rem.mainList.html('');   // 清空列表中原有的元素
                addListhead();      // 加载列表头
            } else {
                $("#list-foot").remove();     //已经是加载后面的页码了，删除之前的“加载更多”提示
            }
            
            if(jsonData.length === 0)
            {
                addListbar("nomore");  // 加载完了
                return false;
            }
            
            var tempItem = [], no = musicList[0].item.length;
            
            for (var i = 0; i < jsonData.length; i++) {
                no ++;
                tempItem =  {
                    id: jsonData[i].musicID,  // 音乐ID
                    name: jsonData[i].songName,  // 音乐名字
                    artist: jsonData[i].artist, // 艺术家名字
                    album: jsonData[i].album,    // 专辑名字
                    url_id: jsonData[i].url_id,  // 链接ID
                    pic_id: null,  // 封面ID
                    lyric_id: jsonData[i].musicID,  // 歌词ID
                    pic: jsonData[i].pic,    // 专辑图片
                    url: null   // mp3链接
                };
                musicList[0].item.push(tempItem);   // 保存到搜索结果临时列表中
                addItem(no, tempItem.name, tempItem.artist, tempItem.album);  // 在前端显示
            }
            
            rem.dislist = 0;    // 当前显示的是搜索列表
            rem.loadPage ++;    // 已加载的列数+1
            
            dataBox("list");    // 在主界面显示出播放列表
            refreshList();  // 刷新列表，添加正在播放样式
            
            if(no < mkPlayer.loadcount) {
                addListbar("nomore");  // 没加载满，说明已经加载完了
            } else {
                addListbar("more");     // 还可以点击加载更多
            }
            
            if(rem.loadPage == 2) listToTop();    // 播放列表滚动到顶部
        },   //success
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            layer.msg('搜索结果获取失败 - ' + XMLHttpRequest.status);
            console.error(XMLHttpRequest + textStatus + errorThrown);
        }   // error
    });//ajax
}

// 完善获取音乐信息
// 音乐所在列表ID、音乐对应ID、回调函数
function ajaxUrl(music, callback)
{
    // 已经有数据，直接回调
    if(music.url !== null && music.url !== "err" && music.url !== "") {
        callback(music);
        return true;
    }
    // id为空，赋值链接错误。直接回调
    if(music.id === null) {
        music.url = "err";
        updateMinfo(music); // 更新音乐信息
        callback(music);
        return true;
    }
    
    $.ajax({ 
        type: mkPlayer.method, 
        url: mkPlayer.getSongDownloadUrl,
        data: "rid=" + music.id,
        dataType : "json",
        success: function(jsonData){
            // 调试信息输出
            if(mkPlayer.debug) {
                console.debug("歌曲链接：" + jsonData[0]);
            }
            
            if(jsonData[0] === "") {
                music.url = "err";
            } else {
                music.url = jsonData[0];    // 记录结果
            }
            
            updateMinfo(music); // 更新音乐信息
            
            callback(music);    // 回调函数
            return true;
        },   //success
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            layer.msg('歌曲链接获取失败 - ' + XMLHttpRequest.status);
            console.error(XMLHttpRequest + textStatus + errorThrown);
        }   // error 
    }); //ajax
    
}

// 完善获取音乐封面图
// 包含音乐信息的数组、回调函数
function ajaxPic(music, callback)
{
    // 已经有数据，直接回调
    if(music.pic !== null && music.pic !== "err" && music.pic !== "") {
        callback(music);
        return true;
    }
    // pic_id 为空，赋值链接错误。直接回调
    if(music.pic_id === null) {
        music.pic = "err";
        updateMinfo(music); // 更新音乐信息
        callback(music);
        return true;
    }
    
    $.ajax({ 
        type: mkPlayer.method, 
        url: mkPlayer.api,
        data: "types=pic&id=" + music.pic_id + "&source=" + music.source,
        dataType : "jsonp",
        success: function(jsonData){
            // 调试信息输出
            if(mkPlayer.debug) {
                console.log("歌曲封面：" + jsonData.url);
            }
            
            if(jsonData.url !== "") {
                music.pic = jsonData.url;    // 记录结果
            } else {
                music.pic = "err";
            }
            
            updateMinfo(music); // 更新音乐信息
            
            callback(music);    // 回调函数
            return true;
        },   //success
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            layer.msg('歌曲封面获取失败 - ' + XMLHttpRequest.status);
            console.error(XMLHttpRequest + textStatus + errorThrown);
        }   // error 
    }); //ajax
    
}

//解析歌词
function parserLrc(lrcList){
    let  r = "";
    for(let i in lrcList){
        let item = lrcList[i];
        let word = item["lineLyric"];
        let d = item["time"];
        let oneMinute = 60;
        let c =  parseInt(d / oneMinute);
        d -= c * oneMinute;
        let min = c;
        let sec = d.toFixed(2);
        if (c < 60){
            min = "0" + c;
        }
        if (d < 10){
            sec = "0" + sec;
        }
        let ut = "["+min+":"+sec+"]";
        r += ut + word+ "\n";
    }
    return r
}

// ajax加载歌词
// 参数：音乐ID，回调函数
function ajaxLyric(music, callback) {
    lyricTip('歌词加载中...');
    
    if(!music.lyric_id) callback('');  // 没有歌词ID，直接返回
    let turl = "http://m.kuwo.cn/newh5/singles/songinfoandlrc?musicId=" + music.lyric_id
    $.ajax({
        type: mkPlayer.method,
        url: turl,
        dataType : "json",
        success: function(jsonData){
            let lrcString = jsonData["data"]["lrclist"]
            let p = parserLrc(lrcString)
            if (p) {
                callback(p, music.lyric_id);    // 回调函数
            } else {
                callback('', music.lyric_id);    // 回调函数
            }
        },   //success
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            layer.msg('歌词读取失败 - ' + XMLHttpRequest.status);
            console.error(XMLHttpRequest + textStatus + errorThrown);
            callback('', music.lyric_id);    // 回调函数
        }   // error   
    });//ajax
}
