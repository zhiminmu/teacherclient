var drawdownflag=false;
var selectischeck=false,lineselectischeck=true,wordischecked=false,
    deleteischeck=false,rectselectischeck=false;
var ctx,ctxeffect;
var drawtype;
var pointArr=new Array();
var adapter=Object.create(ConfAdapter);
var companyId,ROOM_JID,usernameid,Fromusername,userpass,prespass,serverIp,nickname;
var uuid=0;
/***
 *
 */
$(document).ready(function(){
    init();
});
/**
 * myconnect
 */
var myconnect=function(){
    companyId=sessionStorage.corporateAccount;
    ROOM_JID=sessionStorage.conferenceID;
    usernameid=sessionStorage.userName;
    Fromusername=usernameid+"_"+companyId;
    userpass=sessionStorage.password;
    serverIp="120.25.73.123";
    prespass="";
    var openfireurl=window.location.protocol;
    if(openfireurl==="https:")
        adapter.connection = new Openfire.Connection("wss://"+serverIp+":7443/ws/server");
    else{
        adapter.connection = new Openfire.Connection("ws://"+serverIp+":7070/ws/server");    }

    adapter.connection.rawInput = function (data) {
        console.log('RECV: ' + data);
        try {
            var xmlStrDoc=null;
            xmlStrDoc=createXMLstrDoc(data);
            var iqnode=null;
            if(xmlStrDoc.documentElement.nodeName==="iq")
                iqnode=xmlStrDoc.documentElement;
            else
                return;
            adapter.ParserXMPPString(iqnode);
        }
        catch (e){
            alert(e);
        }
        //   handleInputmsg(data);
    };
    adapter.connection.rawOutput = function (data) {
         console.log('SEND: ' + data);
    };
    adapter.connection.connect(Fromusername,userpass,onConnect);
    $("#logindlg").css("display","none");
}
/***
 *
 * @param status
 */
var onConnect=function(status) {
    if (status == Strophe.Status.CONNECTING) {
          // alert('Strophe is connecting.');
    } else if (status == Strophe.Status.CONNFAIL) {
          alert('Strophe failed to connect.');
        $('#connect').get(0).value = 'connect';
    } else if (status == Strophe.Status.DISCONNECTING) {
        alert('Strophe is disconnecting.');
    } else if (status == Strophe.Status.DISCONNECTED) {
        alert('Strophe is disconnected.');
        // $('#connect').get(0).value = 'connect';
    } else if (status == Strophe.Status.CONNECTED) {
          // alert('Strophe is connected.');

        adapter.connectstatus = true;
        adapter.connection.addHandler(onMessage, null, 'message', null, null, null);
        adapter.connection.send($pres().tree());
        adapter.connection.send(sendiqagents(serverIp));

    }
}
/**
 * 获取消息时的方法
 * @param msg
 * @returns {Boolean}
 */
function onMessage(msg) {
    var to = msg.getAttribute('to');
    var from = msg.getAttribute('from');
    var type = msg.getAttribute('type');
    var elems = msg.getElementsByTagName('body');
    var recSendTime=msg.getAttribute('date');
    if(!recSendTime)
        recSendTime=new Date().toLocaleTimeString();

    if (type == "chat" && elems.length > 0) {
        var body = elems[0];
        var tmpfrom;
        tmpfrom=from.slice(from.indexOf('/')+1);
        log_othersmsg(tmpfrom,recSendTime, Strophe.getText(body));

    }
    if(type==="groupchat"&&elems.length>0){
        var body =elems[0];
        //如果from是裸JID的话就不予处理，只有在携带资源的JId才会进行处理
        if(from.indexOf('/')!==-1){
            if(adapter.selfRoomID.indexOf(from.slice(from.indexOf('/') + 1))!==-1)
                log_myselfmsg(from.slice(from.indexOf('/') + 1)  ,recSendTime, Strophe.getText(body));
            else
                log_othersmsg(from.slice(from.indexOf('/') + 1)  ,recSendTime, Strophe.getText(body));

        }
    }
    var scrolldiv=document.getElementById("dlgbody");
    scrolldiv.scrollTop = scrolldiv.scrollHeight;
    return true;
}
/***
 *
 * @param IQMessage
 * @constructor
 */
adapter.ParserXMPPString=function(IQMessage) {

    try {
        var xmlnsVal;
        var query = IQMessage.getElementsByTagName("query")[0];
        xmlnsVal = query.getAttribute("xmlns");
        var querytype = query.getAttribute("type");

        if (xmlnsVal === "jabber:iq:agents") {

            var agentArr = query.getElementsByTagName("agent");
            ServerHttp = agentArr[0].getAttribute("jid") + "upload/";
            ROOM_JID = ROOM_JID + "@" + agentArr[1].getAttribute("jid");
            adapter.imguploadurl = ServerHttp.replace(":80", ":18080/api");
            adapter.connection.send($pres().tree());
            adapter.connection.send($pres({
                to: ROOM_JID
            }).c('x', {xmlns: 'cellcom:conf:enter'}).tree());

            adapter.connection.send($iq({
                id: "jcl_121",
                type: "set",
                to: ROOM_JID
            }).c("query", {xmlns: "cellcom:conf:enter"}).c("password", "", prespass).up().c("nick", "", nickname).c("username", "", Fromusername).c("userpass", "", userpass).tree());
        }
        if(xmlnsVal==="cellcom:conf:enter"){
            var error=IQMessage.getElementsByTagName("error")[0];;
            if(error)
            {

                var errCode=error.getAttribute("code");
                var errStr=error.firstChild.nodeValue;
                var errorIf=Object.create(ErrorInfo);;
                errorIf.errorDescription="";

                if(errCode===180)
                    errorIf.errorNo=ADAPTER_ERROR_TYPE.ADAPTER_ERROR_WRONG_NAME_OR_PASSWORD;
                else if(errCode===2007)
                    errorIf.errorNo=ADAPTER_ERROR_TYPE.ADAPTER_ERROR_CONFERENCE_NOT_EXIST;
                else
                    errorIf.errorNo=errCode;

                errorIf.errorDescription=errStr;
                alert(errStr);
                //注册回调
                return true;

            }else{

                var mixmode=query.getElementsByTagName("mixmode")[0];

                this.selfRoomID=query.getElementsByTagName("id")[0].firstChild.nodeValue;
                selftruename=adapter.selfRoomID.slice(adapter.selfRoomID.indexOf("/")+1);
                $("#tchname p").html("教师:"+"<span>"+selftruename+"<span>");
                //获取会议名
                this.presenceName=query.getElementsByTagName("topic")[0].firstChild.nodeValue;                
                //显示本人用户名

                return true;
            }

        }
        if(xmlnsVal==="cellcom:conf:user")
        {
            var user=query.getElementsByTagName("user");
            var i;
            for(i=0;i<user.length;i++)
            {
                var userJid=user[i].getAttribute("jid");
                var type=user[i].getAttribute("type");
                var name=user[i].getAttribute("name");
                if(name!==null){
                    var tmptag=0;
                    for(var ti=0;ti<adapter.userrefArr.length;ti++)
                    {
                        if(adapter.userrefArr[ti].name!==name)
                            tmptag++;
                    }
                    if(tmptag>=adapter.userrefArr.length)
                        adapter.userrefArr.push({"name":name,"id":tmptag});
                }
                var voice=user[i].getAttribute("voice");
                var ctl=user[i].getAttribute("ctl");
                var identity=user[i].getAttribute("identity");
                var videoCap=null;
                var voiceCap=null;
                var videoCapEle=user[i].getElementsByTagName("videocap")[0];
                var voiceCapEle=user[i].getElementsByTagName("voicecap")[0];
                if(videoCapEle)
                    videoCap=videoCapEle.firstChild.nodeValue;
                if(voiceCapEle)
                    voiceCap=voiceCapEle.firstChild.nodeValue;

                var mmid;
                var mmidEle=user[i].getElementsByTagName("mmid")[0];
                if(mmidEle)
                    mmid=mmidEle.firstChild.nodeValue;
                var mmidList=user[i].getElementsByTagName("mmidList")[0];

                var pos=-1;
                //一堆userlist处理。。。
                var temPos=0;
                for(var j=0;j<this.confUsers.length;j++)
                {
                    var oneUserInfo=this.confUsers[j];
                    if(oneUserInfo.jid===userJid)
                    {
                        if((type)&&(type==="remove")){
                            var mmidCurrentDelete=oneUserInfo.mmidListTraverse[oneUserInfo.mmidListTraverse.length-1];
                            /*if (clientSession) {
                             clientSession->deleteTalker(mmidCurrentDelete);
                             }*/
                            var tmpname=this.confUsers[j].name;
                            var tmpid;
                            for(var k=0;k<adapter.userrefArr.length;k++)
                            {
                                if(adapter.userrefArr[k].name===tmpname)
                                {
                                    tmpid=adapter.userrefArr[k].id;
                                    break;
                                }

                            }
                            $("."+oneUserInfo.mmidListTraverse[0]).remove();
                            $("#"+tmpid+"_user").remove();
                            if(this.isLeaveConference)
                                this.confUsers.length=0;
                            else
                                this.confUsers.splice(j,1);

                        }
                        else{
                            if(name){
                                var isFindMMID=false;
                                oneUserInfo.name=name;
                                if(voice)
                                    oneUserInfo.voice=voice;
                                if(identity)
                                    oneUserInfo.identity=identity;
                                if(ctl)
                                    oneUserInfo.userCtl=ctl;
                                if(videoCap)
                                    oneUserInfo.videoCap=videoCap;
                                if(voiceCap)
                                    oneUserInfo.voiceCap=voiceCap;

                                for(var k=0;k<oneUserInfo.mmidListTraverse.length;k++)
                                {
                                    if(oneUserInfo.mmidListTraverse[k]===null)
                                        continue;
                                    if(oneUserInfo.mmidListTraverse[k]===mmid)
                                        isFindMMID=true;

                                }
                                if(!isFindMMID){
                                    if(mmid!==0){
                                        if(name===selftruename)
                                            this.myselfmmid=mmid;
                                        oneUserInfo.mmidListTraverse.unshift(mmid);
                                    }

                                }
                                if(mmidList){
                                    var userDes=mmidList.getElementsByTagName("userDes");
                                    for(var k=0;k<userDes.length;k++)
                                    {
                                        var mmidEx=userDes[k].getAttribute("mmid");
                                        var isFindMMIDEx=false;
                                        for(var j=0;j<oneUserInfo.mmidListTraverse.length;j++)
                                        {
                                            if(oneUserInfo.mmidListTraverse[j]===null)
                                                continue;
                                            if(oneUserInfo.mmidListTraverse[j]===mmidEx)//mmidEx转成long
                                                isFindMMIDEx=true;
                                        }
                                        if(!isFindMMIDEx)
                                            oneUserInfo.mmidListTraverse.unshift(mmidEx);////mmidEx转成long

                                    }
                                }
                            }
                        }
                        pos=temPos;
                        break;
                    }
                    temPos++;

                }
                if(pos===-1)
                {
                    var oneUserInfo=Object.create(ConfUser);
                    oneUserInfo.mmidListTraverse=new Array();
                    oneUserInfo.jid=userJid;
                    if(voice)
                        oneUserInfo.voice=voice;
                    if(name)
                        oneUserInfo.name=name;

                    var isFindMMID=false;
                    for(var j=0;j<oneUserInfo.mmidListTraverse.length;j++)
                    {
                        if(oneUserInfo.mmidListTraverse[j]===null)
                            continue;
                        if(oneUserInfo.mmidListTraverse[j]===mmid)
                            isFindMMID=true;
                    }
                    if(!isFindMMID){
                        if(mmid!=0){

                            oneUserInfo.mmidListTraverse.unshift(mmid);
                        }
                    }
                    if(mmidList){
                        var userDes=mmidList.getElementsByTagName("userDes");
                        for(var i=0;i<userDes.length;i++)
                        {
                            var mmidEx=userDes[i].getAttribute("mmid");
                            var isFindMMIDEx=false;
                            for(var j=0;j<oneUserInfo.mmidListTraverse.length;j++)
                            {
                                if(oneUserInfo.mmidListTraverse[j]===null)
                                    continue;
                                if(oneUserInfo.mmidListTraverse[j]===parseInt(mmidEx))//mmidEx转成long
                                    isFindMMIDEx=true;
                            }
                            if(!isFindMMIDEx)
                                oneUserInfo.mmidListTraverse.unshift(parseInt(mmidEx));////mmidEx转成long

                        }
                    }
                    if(identity)
                        oneUserInfo.identity=identity;
                    if(ctl)
                        oneUserInfo.userCtl=ctl;
                    if(videoCap)
                        oneUserInfo.videoCap=videoCap;
                    if(voiceCap)
                        oneUserInfo.voiceCap=voiceCap;
                    this.confUsers.unshift(oneUserInfo);
                    /*  if(clientSession&&(voice)&&(voice==="speaking")
                     clientSession->addTalker(mmid); */
                }

            }
            $("#memnum").text("成员("+adapter.confUsers.length+")");
            adduserTolist(adapter.confUsers);
            // this.OnConferenceUserChaned(this.confUsers);
            return true;
        }
        if (xmlnsVal==="cellcom:conf:visitor") {
            return true;
        }
        if (xmlnsVal==="cellcom:conf:multigroup") {
            return true;
        }
    }catch (e){
        alert(e.message);
    }
}

/**
 * init
 */
var init=function( ){
    myconnect();
    tab_userdlg("dlg_headct","selected");
    tabmodule("fun_module","selectedmod");
    tabmodeleQ("camera_choose","selectedQ")
    dlgswitchctl();
    initwbtools();
    //开始上课事件
    $("#class_start").on("click",function(){
        // 开始上课功能有待实现＊＊＊＊＊＊＊
    });
    //课间休息事件
    $("#class_break").on("click",function(){
        // 课间休息事件功能有待实现＊＊＊＊＊＊＊＊
    });
    //发送聊天消息事件
    $("#sendmsg").on("click", function () {
        if($("#textval").val()!=='')
        sendmessage( "",$("#textval").val());
        $("#textval").val("");
    })
    document.getElementById("textval").onkeydown = function (e) {
        e = e || window.event;
        ctl_entersendmsg(e);
    }
    //新建白板事件
    $("#newwb p").on("click",function(){
        $("#canvas_tools").css("display","block");
        addwbpage("wb1","223",800,600);
        $("#ppt_title p").html("电子白板");
    });
    //麦克风增强事件
    $(".micro_str").on("click",function(){
        $(this).css({"background-color":"#787878","color":"#F0F0F0"});
        $(".reduce_echo").css({"background-color":"#F0F0F0","color":"#000000"});
        // 麦克风增强的功能有待实现＊＊＊＊＊＊＊＊
    });
    //回音降低事件
    $(".reduce_echo").on("click",function(){
        // 被点击后样式切换
        $(this).css({"background-color":"#787878","color":"#F0F0F0"});
        $(".micro_str").css({"background-color":"#F0F0F0","color":"#000000"});
        // 回音降低事件功能有待实现＊＊＊＊＊＊＊
    });
    //服务器测速事件
    $(".speed_test>p").on("click",function(){
        // 服务器测速事件功能有待实现＊＊＊＊＊＊＊
    });
    //摄像头直播事件
    $("#start_camera").on("click",function(){
        if($("#cover_div").is(":visible")){
            $("#cover_div").css("display", "none");
            // 不理解这里是做什么用的？是显示摄像头的内容吗
        }else {
            $("#cover_div").css("display", "block");
        }

    });
    //音频直播事件
    $("#voice_rtview >div").on("click",function(){
        // 音频直播代表的又是什么？想要完成什么功能？
    });
    //vnc桌面视频直播事件
    $("#vncview> div").on("click",function(){
        // 这个应该是显示桌面的内容，比如说将电子白板的内容显示出来，
        // 这个是直接从本地获取比较好还是从服务器请求得到的结果，应该有响应的库可以实现录制本地视频
        // 这些不用实现桌面视频文件的录制功能吗？
    });
    //隐藏聊天事件
    $("#hidedlg").on("click",function(){
        if( $(this).children("p").text()===">") {
            $("#right_ct").css("display", "none");
            $("#center_ct").css("width", "97%");
            $(this).children("p").text("<");
        }else{
            $("#right_ct").css("display", "block");
            $("#center_ct").css("width", "75%");
            $(this).children("p").text(">");
        }
    })

}

/**
 * tabmodule
 * @param tabid
 * @param activeid
 */
var tab_userdlg=function(tabid,activeid){
    $("#"+tabid).delegate("div:not(#"+activeid+")","click",function(){
        $("#"+$("#"+activeid).attr("tar")).css("display","none");
        $("#"+activeid).removeAttr("id");
        $(this).attr("id",activeid);
        $("#"+$(this).attr("tar")).css("display","block");
        if($(this).attr("tar")==="dlgbody"){
            $(this).children("img").attr("src","./images/u20.png");
            $(this).siblings().children("img").attr("src","./images/u24.png");

        }else{
            $(this).children("img").attr("src","./images/u79.png");
            $(this).siblings().children("img").attr("src","./images/u45.png");

        }

    });
};
/**
 * 初始化的时候首先显示功能列表中课件的内容，监听功能列表中的变化，将响应的内容进行显示和隐藏切换
 * @param tabId
 * @param activeId
 */

var tabmodule=function(tabId,activeId){
    $("#"+tabId).delegate("li:not(#"+activeId+")","click",function(){
        $("#"+$("#"+activeId).attr("tar")).css("display","none");
        $("#"+activeId).removeAttr("id");
        $(this).attr("id",activeId);
        $("#"+$(this).attr("tar")).css("display","block");
    });
}

var tabmodeleQ=function(tabId,activeId){
    $("#"+tabId).delegate("div:not(#"+activeId+")","click",function(){
        $("#"+activeId).removeAttr("id");
        $(this).attr("id",activeId);
        if($(this).attr("tar")==="okq"){

        }
        if($(this).attr("tar")==="goodq"){

        }
        if($(this).attr("tar")==="highq"){

        }

    });

}
/**
 * sendmessage
 * @param user
 * @param msg
 */
var sendmessage=function(user,msg) {
    var time = new Date().toLocaleTimeString();
    if (user === "") {
        var reply = $msg({to: ROOM_JID, type: 'groupchat', date: time}).cnode(Strophe.xmlElement('body', ''
        , msg));
        adapter.connection.send(reply.tree());
    }else{
        var reply = $msg({to: ROOM_JID, type: 'chat', date: time}).cnode(Strophe.xmlElement('body', ''
            , msg));
        adapter.connection.send(reply.tree());
        log_myselfmsg(user,time,msg);
    }
}
/**
 * log_message
 * @param user
 * @param msg
 */
var log_othersmsg=function(user,time,msg){
    var msgp=document.createElement("p");
    msgp.setAttribute("tar",user);
    var span_user=document.createElement("span");
    span_user.setAttribute("class","othersmsg");
    span_user.innerHTML=user;
    msgp.appendChild(span_user);
    msgp.appendChild(document.createTextNode(time));
    msgp.appendChild(document.createElement('br'));
    msgp.appendChild(document.createTextNode(msg));
    $("#dlgbody").append(msgp);
  //  $("#dlgbody").append('<p tar="'+user+'"><span class="othersmsg">'+user+'</span>'+time+'<br/>'+msg+'</p>');

    var tctldiv=document.createElement("div");
    tctldiv.setAttribute("class","tcldiv_cls");
    var  firstrowdiv=document.createElement("div");
    var  secondrowdiv=document.createElement("div");
    secondrowdiv.setAttribute("class","sencondrowcls")
    var userp=document.createElement("p");
    userp.innerHTML=user;
    $(userp).css({"margin":"auto","padding":"3px 0 0 3px","cursor":"default","color":"rgb(93, 176, 40)"});
    var  spkimg=document.createElement('img');
    spkimg.src='./images/33.png';
    $(spkimg).css({"float":"right","cursor":"pointer","margin":"0 2px 0 2px"});
    var  cmrimg=document.createElement('img');
    cmrimg.src='./images/11.png';
    $(cmrimg).css({"float":"right","cursor":"pointer","margin":"0 2px 0 2px"});
    var spktop=document.createElement("p");
    spktop.innerHTML="对他说";
    $(spktop).css({"width":"57px","height":"88%","cursor":"pointer", "text-align":"center","padding":"3px 0 0 0","color":"#000000","border-right":"1px solid #A0A0A0"});
    var nospkp=document.createElement("p");
    nospkp.innerHTML="禁言";
    $(nospkp).css({"width":"43px","height":"88%","cursor":"pointer","text-align":"center","padding":"3px 0 0 0","color":"#000000","border-right":"1px solid #A0A0A0"});
    var cancelp=document.createElement("p");
    cancelp.innerHTML="取消";
    $(cancelp).css({"width":"43px","height":"88%","cursor":"pointer","text-align":"center","padding":"3px 0 0 0","color":"#000000"});

    $(firstrowdiv).append(userp,cmrimg,spkimg);
    $(firstrowdiv).css({"width":"100%","height":"50%","border-bottom":"1px solid #A0A0A0"});
    $(secondrowdiv).append(spktop,nospkp,cancelp);
    $(secondrowdiv).css({"width":"100%","height":"50%"});
    $(tctldiv).append(firstrowdiv,secondrowdiv);
    span_user.appendChild(tctldiv);
    span_user.onclick=function(e){
        $(tctldiv).show();
        $(document).one("click", function()
        {
            $(tctldiv).hide();
        });
        e.stopPropagation();
    };
    spkimg.onclick=function(e){
        console.log("speek to "+$(msgp).attr("tar"));
        $(this).parent().parent().hide();
        e.stopPropagation();
    };
    cmrimg.onclick=function(e){
        console.log("camera to "+$(msgp).attr("tar"));
        $(this).parent().parent().hide();
        e.stopPropagation();
    };
    spktop.onclick=function(e){
        console.log("say to "+$(msgp).attr("tar"));
        $("#textval").val("@"+$(msgp).attr("tar")+":");
        $("#textval").focus();
        $(this).parent().parent().hide();
        e.stopPropagation();
    };
    nospkp.onclick=function(e){
        console.log("pause say to "+$(msgp).attr("tar"));
        $(this).parent().parent().hide();
        e.stopPropagation();
    };
    cancelp.onclick=function(e){
        $(tctldiv).hide();
        e.stopPropagation();
    };

}

var log_myselfmsg=function(user,time,msg){
    $("#dlgbody").append('<p><span class="myselfmsg">'+user+'</span>'+time+'<br/>'+msg+'</p>');
}
/**
 * ctl_entersendmsg
 * @param e
 */
var ctl_entersendmsg=function(e){
    if(e.ctrlKey && e.keyCode == 13) {
        if($("#textval").val()!=='')
        sendmessage("",$("#textval").val());
        $("#textval").val("");
    }

}

/**
 * dlgswitchctl
 */
var dlgswitchctl= function () {
    var div2=document.getElementById("switch_status");
    var div1=document.getElementById("switch_ct");
    div1.onclick=function(){
        div1.className=(div1.className=="close1")?"open1":"close1";
        div2.className=(div2.className=="close2")?"open2":"close2";
        if(div2.className==="open2") {
            $("#switch_ct p").html("开");
            $("#switch_ct p").css({"left":"0px","right":"auto"});
        }
        else{
            $("#switch_ct p").html("关");
            $("#switch_ct p").css({"left":"auto","right":"0px"});
        }
    }
}


var addwbpage=function(tit,pgjid,width,height){
    var x,y,deletex,deletey,offsetdifX,offsetdifY;
    if(document.getElementById(tit)===null){

        var wbpageulwidth=$("#wbpage_ul").width();
        var wbpageulheight=$("#wbpage_ul").height();
        var canvasmarginleft=0,canvasmargintop=0;
        if(wbpageulwidth>800)
            canvasmarginleft=(wbpageulwidth-800)/2;
        if(wbpageulheight>600)
            canvasmargintop=(wbpageulheight-600)/2;
        $("#wbpage_ul").append("<li id='"+tit+"' class='canvasmargin' title='"+tit+
        "' style='background:#FFFFFF; clear:both;width:"+width+"px;height:"+height+
        "px' ><canvas style=' position:absolute;border:solid 1px #000000' width='"+width+
        "' height='"+height+"' ></canvas><canvas style=' position:absolute;border:solid 1px #000000; 'width='"
        +width+"' height='"+height+"' ></canvas><canvas style=' position:absolute;border:solid 1px #000000; display:none'width='"
        +width+"' height='"+height+"' ></canvas></li>");
        ctx=document.getElementById(tit).children[1].getContext("2d");
        ctxeffect=document.getElementById(tit).children[2].getContext("2d");
        $(".canvasmargin").css({"margin-left":canvasmarginleft,"margin-top":canvasmargintop});
        $("#canvas_tools").css("display","block");
//canvas绑定mousedown
        $("#"+tit).children().eq(1).mousedown(function(e){
            initlinestyle(document.getElementById("lineselect"));

            drawdownflag=true;
            var offset=$(this).offset();
            var deleteoffset=$("#wbpage").offset();
            if(parseInt(deleteoffset.left)>parseInt(offset.left))
                offsetdifX=parseInt(deleteoffset.left)-parseInt(offset.left);
            else
                offsetdifX=0;
            if(parseInt(deleteoffset.top)>parseInt(offset.top))
                offsetdifY=parseInt(deleteoffset.top)-parseInt(offset.top);
            else
                offsetdifY=0;
            deletex=parseInt(e.pageX-deleteoffset.left);
            deletey=parseInt(e.pageY-deleteoffset.top);
            pointArr.length=0;
            x=parseInt(e.pageX-offset.left);
            y=parseInt(e.pageY-offset.top);
            switch(drawtype){
                case "line": ctx.beginPath(); break;
                case "thinfreeline":
                case "thickfreeline":ctx.beginPath();break;
                case "fluorepen":ctx.beginPath();break;
                case "rect":ctx.beginPath();break;
                case "roundrect" :ctx.beginPath();break;
                case "round" :ctx.beginPath();break;
                case "text" :ctx.beginPath();if(fontTip.css("display")=== "none")fakeWordsInput(deletex,deletey,x,y,drawdownflag,true);break;
                case "select":break;
                case "delete":break;
                default: break;
            }
        });
//canvas 绑定mousemove
        $("#"+tit).children().eq(1).mousemove(function(e){
            var offset = $(this).offset();
            var deleteoffset=$("#wbpage").offset();
            if(parseInt(deleteoffset.left)>parseInt(offset.left))
                offsetdifX=parseInt(deleteoffset.left)-parseInt(offset.left);
            else
                offsetdifX=0;
            if(parseInt(deleteoffset.top)>parseInt(offset.top))
                offsetdifY=parseInt(deleteoffset.top)-parseInt(offset.top);
            else
                offsetdifY=0;
            var tmpdeletx=parseInt(e.pageX-deleteoffset.left);
            var tmpdelety = parseInt(e.pageY-deleteoffset.top);
            var tmpx = parseInt(e.pageX-offset.left);
            var tmpy = parseInt(e.pageY-offset.top);
            if(drawdownflag){
                pointArr.push({"x":tmpx,"y":tmpy});
                switch(drawtype){
                    case "line":$("#"+tit).children().last().css("display","block");  break;
                    case "thinfreeline":
                    case "thickfreeline":ctldrawThinfreeline(tmpx,tmpy,drawdownflag);break;
                    case "fluorepen":ctldrawfluorepen(tmpx,tmpy,drawdownflag);break;
                    case "rect":$("#"+tit).children().last().css("display","block"); break;
                    case "roundrect":$("#"+tit).children().last().css("display","block");break;
                    case "round" :$("#"+tit).children().last().css("display","block");break;
                    case "text" :fakeWordsInput(deletex,deletey,tmpdeletx,tmpdelety,drawdownflag,false);break;
                    case "select":$("#"+tit).children().last().css("display","block");break;
                    case "delete":$("#"+tit).children().last().css("display","block");break;
                    default: break;
                }
            }
        });
//canvas 绑定mouseup
        $("#"+tit).children().eq(1).mouseup(function(e){
            drawdownflag=false;
            var offset=$(this).offset();
            endx=parseInt(e.pageX-offset.left);
            endy=parseInt(e.pageY-offset.top);
            switch(drawtype){
                case "line":  ctx.closePath();break;
                case "thinfreeline":
                case "thickfreeline":ctx.closePath();break;
                case "fluorepen":ctx.closePath();break;
                case "rect": break;
                case "roundrect" :break;
                case "round" :break;
                case "text" :fontTip.focus();break;
                case "select":break;
                case "delete": break;
                default: break;
            }
        });
        //effectcanvas 绑定mousemove
        $("#"+tit).children().eq(2).mousemove(function(e){
            var offset = $(this).offset();
            var tmpx = parseInt(e.pageX-offset.left);
            var tmpy = parseInt(e.pageY-offset.top);
            ctxeffect.strokeStyle=ctx.strokeStyle;
            ctxeffect.lineWidth=ctx.lineWidth;
            ctxeffect.lineCap=ctx.lineCap;
            switch(drawtype){
                case "line": ctldrawlineEffect(x,y,tmpx,tmpy,drawdownflag); break;
                case "thinfreeline":
                case "thickfreeline":break;
                case "fluorepen":break;
                case "rect":ctldrawRectEffect(x,y,tmpx,tmpy,drawdownflag); break;
                case "roundrect":ctldrawRoundrecteEffect(x,y,tmpx,tmpy,drawdownflag);break;
                case "round" :drawRoundEffect(x,y,tmpx,tmpy,drawdownflag);break;
                case "text" :break;
                case "select":ctldrawdashrectEffect(x,y,tmpx,tmpy,drawdownflag);break;
                case "delete":ctldrawdashrectEffect(x,y,tmpx,tmpy,drawdownflag);break;
                default: break;
            }
        });
        $("#"+tit).children().eq(2).mouseup(function(e){
            drawdownflag=false;
            var offset=$(this).offset();
            endx=parseInt(e.pageX-offset.left);
            endy=parseInt(e.pageY-offset.top);
            if(drawtype!=="text")
                pointArr.push({"x":endx,"y":endy});
            ctxeffect.clearRect(0,0,2000,2000);
            $(this).css("display","none");
            switch(drawtype){
                case "line": ctldrawline(x,y,endx,endy); break;
                case "thinfreeline":
                case "thickfreeline":break;
                case "fluorepen":break;
                case "rect": ctldrawRect(x,y,endx,endy);break;
                case "roundrect" :ctldrawRoundrect(x,y,endx,endy);break;
                case "round" :ctldrawRound(x,y,endx,endy);break;
                case "text" :break;
                case "select": break;
                case "delete":deletemouseupfun(x,y,endx,endy); break;
                default: break;
            }
        });

    }
}

/**
 *initlinestyle
 */
var initlinestyle=function(obj){
    ctx.lineWidth=1;
    if(lineselectischeck)
    {
        drawtype=obj.value;
        var index=obj.selectedIndex;
        ctx.lineWidth=obj.options[index].attributes["linewidth"].nodeValue;
    }
    if(rectselectischeck)
    {
        drawtype=document.getElementById("rectselect").value;
        var index=document.getElementById("rectselect").selectedIndex;
        ctx.lineWidth=document.getElementById("rectselect").options[index].attributes["linewidth"].nodeValue;

    }
    if(wordischecked)
        drawtype="text";
    if(selectischeck)
        drawtype="select";
    if(deleteischeck)
        drawtype="delete";
    ctx.lineCap="round";
    ctx.strokeStyle=document.getElementById("colorslt").value;//replaceRB(strToHex(document.getElementById("colorslectct").value));
    if(drawtype=="fluorepen")
        ctx.strokeStyle="rgba(172,254,172,0.7)";
    ctx.fillStyle=document.getElementById("colorslt").value;//replaceRB(strToHex(document.getElementById("colorslectct").value));

}

/**
 *初始化白板工具相关
 */
var initwbtools=function(){
    fontTip =$("<textarea rows='3' cols='20' style='background:transparent;position:absolute;display:none;width:60px;height:30px'></textarea>");
    $("#wbpage").append(fontTip);
    CanvasRenderingContext2D.prototype.dashedLineTo = function (fromX, fromY, toX, toY, pattern) {
        // default interval distance -> 5px
        if (typeof pattern === "undefined") {
            pattern = 5;
        }

        // calculate the delta x and delta y
        var dx = (toX - fromX);
        var dy = (toY - fromY);
        var distance = Math.floor(Math.sqrt(dx*dx + dy*dy));
        var dashlineInteveral = (pattern <= 0) ? distance : (distance/pattern);
        var deltay = (dy/distance) * pattern;
        var deltax = (dx/distance) * pattern;

        // draw dash line
        this.beginPath();
        for(var dl=0; dl<dashlineInteveral; dl++) {
            if(dl%2) {
                this.lineTo(fromX + dl*deltax, fromY + dl*deltay);
            } else {
                this.moveTo(fromX + dl*deltax, fromY + dl*deltay);
            }
        }
        this.stroke();
    };


/*    $(fontTip).mousemove(function(e) {
        if(drawdownflag)
        {
            var tmpdelx=offsetdifX+deletex;
            var tmpdely=offsetdifY+deletey;
            fontTip.css({left:tmpdelx,top:tmpdely});
            var offset=$("#wbpage").offset();
            fontTip.width(e.pageX-offset.left-deletex);
            fontTip.height(e.pageY-offset.top-deletey);
        }
    });*/
    $(fontTip).mouseup(function() {
        drawdownflag=false;
        fontTip.focus();
    });
    fontTip.blur(ctldrawWords);

    $("#new_newpg").on("click",function(){


    });
    $("#select").on("click",function(){
        $(this).attr("class","onclickstate");
        $("#deleteele").removeAttr("class");
        $("#lineselect").removeAttr("class");
        $("#newword").removeAttr("class");
        $("#rectselect").removeAttr("class");
        selectischeck=true;
        lineselectischeck=false;
        wordischecked=false;
        deleteischeck=false;
        rectselectischeck=false;
    });
    $("#deleteele").on("click",function(){
        $(this).attr("class","onclickstate");
        $("#select").removeAttr("class");
        $("#lineselect").removeAttr("class");
        $("#newword").removeAttr("class");
        $("#rectselect").removeAttr("class");
        selectischeck=false;
        lineselectischeck=false;
        wordischecked=false;
        deleteischeck=true;
        rectselectischeck=false;
    });
    $("#lineselect").on("click",function(){
        $(this).attr("class","onclickstate");
        $("#deleteele").removeAttr("class");
        $("#select").removeAttr("class");
        $("#newword").removeAttr("class");
        $("#rectselect").removeAttr("class");
        selectischeck=false;
        lineselectischeck=true;
        wordischecked=false;
        deleteischeck=false;
        rectselectischeck=false;
    });
    $("#newword").on("click",function(){
        $(this).attr("class","onclickstate");
        $("#deleteele").removeAttr("class");
        $("#lineselect").removeAttr("class");
        $("#select").removeAttr("class");
        $("#rectselect").removeAttr("class");
        selectischeck=false;
        lineselectischeck=false;
        wordischecked=true;
        deleteischeck=false;
        rectselectischeck=false;
    });
    $("#rectselect").on("click",function(){
        $(this).attr("class","onclickstate");
        $("#deleteele").removeAttr("class");
        $("#lineselect").removeAttr("class");
        $("#select").removeAttr("class");
        $("#newword").removeAttr("class");
        selectischeck=false;
        lineselectischeck=false;
        wordischecked=false;
        deleteischeck=false;
        rectselectischeck=true;

    });
    /* $("#showcolor").on("click",function(){

     });*/


}

/**
 *ctldrawline
 */
var ctldrawline=function(x,y,dtx,dty){
    ctxeffect.clearRect(0,0,2000,2000);
    ctx.beginPath();
    x=x-0.5;
    y=y-0.5;
    dtx=dtx-0.5;
    dty=dty-0.5;
    if(ctx.lineWidth>1)
    {
        ctx.moveTo(x,y);
        ctx.lineTo(dtx,dty);
    }
    else{
        ctx.moveTo(x,y);
        ctx.lineTo(dtx,dty);
    }
    ctx.stroke();
    ctx.closePath();

}
/**
 *ctldrawlineEffect
 */
var ctldrawlineEffect=function(x,y,dtx,dty,drawdownflag)
{
    if(drawdownflag){
        ctxeffect.clearRect(0,0,2000,2000);

        ctxeffect.beginPath();
        x=x-0.5;
        y=y-0.5;
        dtx=dtx-0.5;
        dty=dty-0.5;
        if(ctxeffect.lineWidth>1)
        {
            ctxeffect.moveTo(x,y);
            ctxeffect.lineTo(dtx,dty);
        }
        else{
            ctxeffect.moveTo(x,y);
            ctxeffect.lineTo(dtx,dty);
        }
        ctxeffect.stroke();
        ctxeffect.closePath();
    }
}
/**
 *ctldrawRect
 */
var ctldrawRect=function(x,y,dtx,dty)
{
    ctxeffect.clearRect(0,0,2000,2000);
    var w=Math.abs(dtx-x);
    var h=Math.abs(dty-y);
    if(parseInt(x)>parseInt(dtx)) x=dtx;
    if(parseInt(y)>parseInt(dty)) y=dty;
    ctx.beginPath();


    ctx.strokeRect(x-0.5,y-0.5,w,h);
    ctx.closePath();


}
/**
 *ctldrawRectEffect
 */
var ctldrawRectEffect=function(x,y,dtx,dty,drawdownflag)
{
    if(drawdownflag){
        ctxeffect.clearRect(0,0,2000,2000);
        var w=Math.abs(dtx-x);
        var h=Math.abs(dty-y);
        if(parseInt(x)>parseInt(dtx)) x=dtx;
        if(parseInt(y)>parseInt(dty)) y=dty;
        ctxeffect.beginPath();

        ctxeffect.strokeRect(x-0.5,y-0.5,w,h);
        ctxeffect.closePath();
    }
}
/**
 *ctldrawThinfreeline
 */
var ctldrawThinfreeline=function(x,y,drawdownflag)
{

    if(drawdownflag){


        if(ctx.lineWidth>1)
            ctx.lineTo(x,y);
        else
            ctx.lineTo(x,y);
        ctx.stroke();
    }

}
/**
 *drawround
 */
var ctldrawRound=function(x,y,dtx,dty){
    ctxeffect.clearRect(0,0,2000,2000);
    ctx.save();
    ctx.beginPath();
    var x0=(parseInt(dtx)+parseInt(x))/2;
    var y0=(parseInt(dty)+parseInt(y))/2;
    var w=Math.abs(dtx-x)/2;
    var h=Math.abs(dty-y)/2;
    var r = (w > h)? w : h;
    var ratioX = w / r; //横轴缩放比率
    var ratioY = h / r; //纵轴缩放比率
    ctx.scale(ratioX, ratioY); //进行缩放（均匀压缩）
//从椭圆的左端点开始逆时针绘制
    ctx.moveTo((x0 + w) / ratioX , y0 / ratioY);
    ctx.arc(x0 / ratioX, y0 / ratioY, r, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.closePath();
    ctx.restore();

}
/**
 *drawroundEffect
 */
var drawRoundEffect=function(x,y,dtx,dty,drawdownflag){

    if(drawdownflag)
    {
        ctxeffect.clearRect(0,0,2000,2000);
        ctxeffect.beginPath();
        ctxeffect.save();
        var x0=(parseInt(dtx)+parseInt(x))/2;
        var y0=(parseInt(dty)+parseInt(y))/2;
        var w=Math.abs(dtx-x)/2;
        var h=Math.abs(dty-y)/2;
        var r = (w > h)? w : h;
        var ratioX = w / r; //横轴缩放比率
        var ratioY = h / r; //纵轴缩放比率
        ctxeffect.scale(ratioX, ratioY); //进行缩放（均匀压缩）
//从椭圆的左端点开始逆时针绘制
        ctxeffect.moveTo((x0 + w) / ratioX , y0 / ratioY);
        ctxeffect.arc(x0 / ratioX, y0 / ratioY, r, 0, 2 * Math.PI);
        ctxeffect.stroke();
        ctxeffect.restore();
        ctxeffect.closePath();

    }

}
/**
 *ctldrawdashrectEffect
 */
var ctldrawdashrectEffect=function(x,y,dtx,dty) {
    if(drawdownflag)
    {
        ctxeffect.strokeStyle="#000000";
        ctxeffect.clearRect(0,0,2000,2000);
        var w=Math.abs(dtx-x);
        var h=Math.abs(dty-y);
        if(parseInt(x)>parseInt(dtx)) x=dtx;
        if(parseInt(y)>parseInt(dty)) y=dty;
        ctxeffect.beginPath();
        ctxeffect.dashedLineTo(x-0.5,y-0.5,x+w-0.5,y-0.5);
        ctxeffect.dashedLineTo(x+w-0.5,y-0.5,x+w-0.5,y+h-0.5);
        ctxeffect.dashedLineTo(x+w-0.5,y+h-0.5,x-0.5,y+h-0.5);
        ctxeffect.dashedLineTo(x-0.5,y+h-0.5,x-0.5,y-0.5);

        ctxeffect.closePath();

    }

}
/**
 *ctldrawRoundrect
 */
var ctldrawRoundrect=function(x,y,dtx,dty){
    ctxeffect.clearRect(0,0,2000,2000);
    var w=Math.abs(dtx-x);
    var h=Math.abs(dty-y);
    if(parseInt(x)>parseInt(dtx)) x=dtx;
    if(parseInt(y)>parseInt(dty)) y=dty;
    var x0=parseInt(x)-0.5;
    var y0=parseInt(y)-0.5;
// var r = w / 2;
    var r = 25;
    if (w <2 * r) r = w / 3;
    if (h < 2 * r) r = h / 3;
    ctx.beginPath();
    ctx.moveTo(x0+r, y0);
    ctx.arcTo(x0+w, y0, x0+w, y0+h, r);
    ctx.arcTo(x0+w, y0+h, x0, y0+h, r);
    ctx.arcTo(x0, y0+h, x0, y0, r);
    ctx.arcTo(x0, y0, x0+w, y0, r);
    ctx.stroke();
    ctx.closePath();

}
/**
 *ctldrawRoundrecteEffect
 */
var ctldrawRoundrecteEffect=function(x,y,dtx,dty,drawdownflag){
    if(drawdownflag){

        ctxeffect.clearRect(0,0,2000,2000);
        var w=Math.abs(dtx-x);
        var h=Math.abs(dty-y);
        if(parseInt(x)>parseInt(dtx)) x=dtx;
        if(parseInt(y)>parseInt(dty)) y=dty;
        var x0=parseInt(x)-0.5;
        var y0=parseInt(y)-0.5;
// var r = w / 2;
        var r = 25;
        if (w <2 * r) r = w / 3;
        if (h < 2 * r) r = h / 3;
        ctxeffect.beginPath();
        ctxeffect.moveTo(x0+r, y0);
        ctxeffect.arcTo(x0+w, y0, x0+w, y0+h, r);
        ctxeffect.arcTo(x0+w, y0+h, x0, y0+h, r);
        ctxeffect.arcTo(x0, y0+h, x0, y0, r);
        ctxeffect.arcTo(x0, y0, x0+w, y0, r);
        ctxeffect.stroke();
        ctxeffect.closePath();
    }


}
/**
 *ctldrawfluorepen
 */
var ctldrawfluorepen=function(x,y,drawdownflag){

    if(drawdownflag)
    {
//11cd0c
        ctx.lineTo(x,y);
        ctx.stroke();
    }

}
/**
 *插入字体输入框
 */
function fakeWordsInput(x,y,dtx,dty,drawdownflag,down)
{


    if(drawdownflag)
    {
        var tmpx=x+offsetdifX*1;
        var tmpy=y+offsetdifY*1;
        fontTip.show();
        fontTip.css({left:tmpx,top:tmpy});
        if(down){
            fontTip.width(60);
            fontTip.height(30);}
        else {
            fontTip.width(dtx - x - 8);
            fontTip.height(dty - y - 8);
        }
    }
}

/**
 *drawWords
 */
function ctldrawWords(){
    var words = fontTip.val();
    if(	fontTip.css("display")!= "none" && words )
    {

        var offset = $("#wb1").first().offset();
        var offset2 = fontTip.offset();
        var fontSize = 20;
        ctx.font="26px Verdana";

//adapter.ctx.fillText(words,offset2.left-offset.left,(offset2.top-offset.top+fontSize*1));
        ctx.fillText(words,offset2.left-offset.left,(offset2.top-offset.top+fontSize*1));
        pointArr.push({"x":parseInt(offset2.left-offset.left),"y":parseInt(offset2.top-offset.top-fontSize*0.2)})

        fontTip.val("");
    }
    fontTip.width(60);
    fontTip.height(30);
    fontTip.hide();
   // if(words!=="")
     //   connection.send(sendlinexml(pointArr,drawtype,pagejid,ctx.lineWidth,words));
}

/**
 *参会用户列表更新
 **/
var adduserTolist=function(userArr){

    /*var userlist_ul=document.getElementById("ul_memlist");
     userlist_ul.innerHTML="";*/
    for(var i=userArr.length-1;i>=0;i--){
        if(userArr[i]===null)
            continue;
        var tmpusername=userArr[i].name;
        var id="";
        var tmpid;
        for(var j=0;j<adapter.userrefArr.length;j++)
        {
            if(adapter.userrefArr[j].name===userArr[i].name){
                tmpid=adapter.userrefArr[j].id
                id=adapter.userrefArr[j].id+"_user";
                break;
            }
        }

        if(document.getElementById(id)===null)
        {


            var li=document.createElement("li");

            var dlgtodiv=document.createElement("div");
            dlgtodiv.setAttribute("class","dlgto");
            dlgtodiv.setAttribute("canspk","true");
            li.setAttribute("id",id);

            var cameradiv=document.createElement("div");
            cameradiv.setAttribute("id",tmpid+"_camimg");
            cameradiv.setAttribute("class","camera");
            var namep=document.createElement("p");
            namep.setAttribute("mmid",userArr[i].mmidListTraverse[0]);
            namep.setAttribute("jid",userArr[i].jid);
            namep.setAttribute("isshowV",false);
            $(namep).css({"cursor":"pointer","overflow":"hidden","text-overflow":"ellipsis","white-space":"nowrap"});
            namep.innerHTML=userArr[i].name;
            var userspkdiv=document.createElement("div");
            userspkdiv.setAttribute("id",tmpid+"_spkimg");
            dlgtodiv.setAttribute("spkdivid",tmpid+"_spkimg");
            userspkdiv.setAttribute("class","userspk");
            if(userArr[i].voice==="speaking")
                $(userspkdiv).css("display","block");
            li.appendChild(userspkdiv);
            li.appendChild(cameradiv);
            if(selftruename===userArr[i].name) {
                var tmpdiv=document.createElement("div");
                $(tmpdiv).css({"width":"26px","height":"24px","float":"left"});

                li.appendChild(tmpdiv);
            }else{
                li.appendChild(dlgtodiv);
            }
            li.appendChild(namep);
            $("#memberlist ul").append(li);
            userspkdiv.onclick=function(){
                console.log("speek to "+$(this).parent().children('p').text());
            }
            cameradiv.onclick=function(){
                console.log("camera to "+$(this).parent().children('p').text());
            }
            dlgtodiv.onclick=function(){
                if($(this).attr("canspk")==="false"){
                    $(this).attr("canspk","true");
                    $(this).css("background-image","url('./images/22.png')");
                   console.log("can msg to "+$(this).parent().children('p').text());
                }

                else{
                    $(this).attr("canspk","false");
                    $(this).css("background-image","url('./images/3.png')");
                    console.log("can't msg to "+$(this).parent().children('p').text());
                }

            }
        }
        else{
            $("#"+id).children("p").first().attr("mmid",userArr[i].mmidListTraverse[0]);
        }
    }
}
/***
 *
 * @param serverip
 * @returns {HTMLElement}
 */
var sendiqagents=function(serverip){

    var doc=createXMLDoc();
    var uuidStr = "jcl_" + uuid++;
    var iq=doc.createElement("iq");
    iq.setAttribute("id", uuidStr);
    iq.setAttribute("to",serverip);
    iq.setAttribute("type","get");
    var query=doc.createElement("query");
    query.setAttribute("xmlns","jabber:iq:agents");
    iq.appendChild(query);
    return iq;

}
