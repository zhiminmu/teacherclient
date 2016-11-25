/**
 * Created by Administrator on 2016/1/5.
 */

var ErrorInfo={
    errorNo:0,
    errorDescription:"",
    userJID:"",
}
var ConfUser={
    name:"",
    userCtl:"",
    identity:"",
    jid:"",
    voice:"",
    mmidListTraverse:[],
    voiceCap:"",
    videoCap:"",
    color:"",
    recorder:false
};
var ConfAttribute={
    conferenceID:"",
    passwordType:"",
    begintime:"",
    endtime:"",
    topic:"",
};
var ADAPTER_ERROR_TYPE={
    ADAPTER_ERROR_NO:0,
    ADAPTER_ERROR_WRONG_NAME_OR_PASSWORD:-1,
    ADAPTER_ERROR_CONNECT_FAIL:-2,
    ADAPTER_ERROR_DISCONNECT:-3,
    ADAPTER_ERROR_SEND_XMPP_FAIL:-4,
    ADAPTER_ERROR_CONFERENCE_NOT_EXIST:-5,
    ADAPTER_ERROR_SERVER_REFUSE:-6
};
//上传参数
var UploadPar={
    fileObj:null,
    filejid:null,
    Status:null,
    toUser:null,
    ClearAll:function(){
        this.fileObj=null;
        this.filejid=null;
        this.Status=null;
        this.toUser=null;
    }
}

//创建xmlDoc对象
function createXMLDoc(){
    var xmlDoc;
    try //Internet Explorer
    {
        xmlDoc=new ActiveXObject("Microsoft.XMLDOM");

    }
    catch(e)
    {

        try //Firefox, Mozilla, Opera, etc.
        {
            xmlDoc=document.implementation.createDocument("","",null);


        }
        catch(e) {alert(e.message+"@@@@@@@@@@@@@@@@")}
    }

    return xmlDoc;
}
//装string转换成xml对象
function createXMLstrDoc(strxml){
    var tmpxmlStrDoc=null;
    if(window.DOMParser){
        var parser=new DOMParser();
        tmpxmlStrDoc=parser.parseFromString(strxml,"text/xml");

    }
    else{
        tmpxmlStrDoc=new ActiveXObject("Microsoft.XMLDOM");
        tmpxmlStrDoc.async="false";
        tmpxmlStrDoc.loadXML(strxml);
    }
    return tmpxmlStrDoc;
}


//Adapter伪类
var UI;
var ConfAdapter={
//For drawing.
    getVideoChannelMap:{},
    haveDrawing:false,
    //yzz insert var
    mouseobj:null,//dskshare var
    isdsktopsharing:false,
    clientW:0,
    clientH:0,
    hostip:'',
    hostport:'',
    dskpass:'',
    channelEnterRoom:'',//Audio video var
    userDesMMID:'',
    userrefArr:new Array(),//用户真实名字与id映射
    handtotal:0,
    handupno:0,
    bgimgdldurlhead:"",
    imguploadurl:"",
    myselfmmid:"",
    dlgimgurl:"",
    orimageW:0,
    orimageH:0,
    chairname:"",
    drawtype:"",
    pagejid:"",
    ctx:"",
    ctxeffect:"",
    isaddpictowb:false,
    fontTip:null,
    slectTip:null,
    isautopresmode:true,
    isallmute:false,
    islockpres:false,
    isautosyncvideo:false,
    ismanualsyncvideo:false,
    issetpregroup:false,
    isRSTPvideo:false,
    isH323:false,
    isphonepres:false,
    isstarthandup:false,
    isdeletefile:false,
    isprerecordauth:false,
    isdlgpersonal:true,
    isdendfiletouser:true,
    issyncdsktoplayout:false,
    ispreschair:false,
    isotheruserchair:false,
    connectstatus:false,
    dlgbtnleftbite:"",
    dlgbtntopbite:"",
    dlgctleftbite:"",
    dlgcttopbite:"",
    ismove:false,
    isSpeaking:false,
    isContrl:0,
    voicemuted:false,
    micromuted:false,
    isprerecord:false,
    dlgisshow:false,
    pointArr:new Array(),
    webviewbrowseArr:new Array(),
    wbbrowseArr:new Array(),
    jclnum:0,
    flag:false,
    selectischeck:false,
    deleteischeck:false,
    lineselectischeck:true,
    wordischecked:false,
    rectselectischeck:false,
    timeinternal:null,
    //yzz insert end
    presenceName:"",
    connection:"",
    drawingWidth:0,
    drawingHeight:0,
    confRoomJID:"",
    currentBGImage:"",
    confServerIP:"",
    ConfUserName:"",
    fileShareSession:"",//CXFileSession对象
    uuid:0,
    m_pAsyncThread:"",//CAsyncThread对象
    selfRoomId:"",
    conferenceMMID:0,
    MMIDDefault:0,
    isFirtMMID:true,
    isFirstDesOfRemote:true,
    slaveMcu:"",
    isLeaveConference:false,
    confUsers:new Array(),
    mmidListSelf:new Array(),
    confAttributes:new Array(),
    isSendingVideo:false,
    isPlayingVideo:false,
    isSendingAudio:false,
    transferTypes:new Array(),
    currentVideoSerialMap:new Array(),
    room_data:"",
    endPointLock:"",//pthread_mutex_t
    //Functions for called outside.
    InitV5System:function(){alert("InitV5System()!!");},
    UnInitV5System:function(){alert("InitV5System()!!");},
    ParserXMPPString:function(IQMessage){},
    EnterRoom:function(serverIP,roomJID,roomPass,nickName,userName,userPass){},
    LeaveRoom:function(){},
    GetMMID:function(userJID){},
    GetVideo:function(userJID,MMID){},
    StopGetVideo:function(userJID,MMID){},
    StartSpeaking:function(){},
    StopSpeaking:function(){},
    SendVideoData:function(buffer, len, uploadMMID){},
    SendVideoData:function(buffer, len, uploadMMID,frameType){},
    InjectAudioData:function(audioDate, audioLen, audioType, currentMMID){},
    ResetDrawing:function(){},
    HaveWhiteBoradSharing:function(){},
    //Get and delete mobile mmid
    DeleteListMMID:function(mmid){},
    SendXMPPMsgToGetLocalAnotherMMID:function(){},
    SendXMPPMsgToDeleteLocalMMID:function(MMID){},
    SendReconnectMsg:function(MMID){},
    //get server information
    GetServerInformation:function(remoteIP){},
    //get meeting list
    GetMeetingRooms:function(remoteIP,appId){},
    //get conference member
    GetConferenceMember:function(){},
    //set audioType
    customAudioType:function(audioTypeStr){},
    audioHelperStop:function(){},
    audioHelperInit:function(){},
    //callback function
    OnSendXMPPString:function(IQMessage){},
    OnConferenceUserChaned:function(userList){},
    OnEnterConfFail:function(errorType,errConferenceInfo){},
    OnEnterConfSuccess:function(conferenceID){},
    OnLeaveConf:function(){},
    OnTransferTestStart:function(){},
    OnTransferTestFail:function(errorType,errInfo){},
    OnTransferTestSuccess:function(types){},
    OnReceiveVideoData:function(buffer,len,MMID, keyFrame,sequence){},
    OnGetVieoSuccess:function(userJID,userMMID){},
    OnGetVieoFail:function(userJID,errorType,errMmid){},
    OnWhiteboardElementsChanged:function(nodeXMLs){},
    OnWhiteboardStart:function(currentPage,name,imageUrl,pageNums){},
    OnWhiteboardEnd:function(name,downloadUrl,pageNum,isCurrentP){},
    OnWhiteboardPageChanged:function(currentPage,name,imageUrl,pageNums){},
    //Set background image for width drawing;
    SetDrawingBackground:function(image){},
    StartDrawing:function(framWidth,frameHeight,resolutionWidth,resolutionHeight,BGImagePath){},
    StopDrawing:function(){},
    //Callback function for web sharing.
    OnWebShareStart:function(webUrl){},
    OnWebShareEnd:function(){},
    OnWebShareUrlChanged:function(webUrl){},
    //DesktopSharing
    OnDesktopSharingStart:function(hostIP,viewerPort,passWord){},
    OnDesktopSharingEnd:function(){},
    //Callback media player
    OnMediaPlayerStreamPublish:function(url,statusPublish,duration,timePoint,filename,conferenceID){},
    OnMediaPlayerStreamPlay:function(url,statusPublish,duration,timePoint,filename,conferenceID){},
    OnMediaPlayerStreamPause:function(url,statusPublish,duration,timePoint,conferenceID){},
    OnMediaPlayerStreamStop:function(url,statusPublish,duration,timePoint,conferenceID){},
    //Callback server information
    OnGetMeetingRooms:function(meetingRoomsList,getSuccess){},
    //private function
    EnterConfFail:function(errInfo){},
    EnterConfSuccess:function(errInfo){},
    SendPriorityPresence:function(){},
    GetAgents:function(){},
    SendAbility:function(mmid){},
    GetTransferInfo:function(){},
    StartTransferTest:function(iqStr){},
    DealTransferOK:function(iqStr){},
    SendOKAsk:function(){},
    StartGetVideo:function(iqStr){},
    EnableSpeaking:function(){},
    ReplyTransferResult:function(types){},
    TransferTestFinish:function(result){},
    TransferTestFail:function(errInfo){},
    GetVideoSuccess:function(result){},
    GetVideoFail:function(errInfo){},
    DealAgentInfo:function(queryEle){},
};
jQuery.fn.rotate = function(angle,whence) {
    var p = this.get(0);

    // we store the angle inside the image tag for persistence
    if (!whence) {
        p.angle = ((p.angle==undefined?0:p.angle) + angle) % 360;
    } else {
        p.angle = angle;
    }

    if (p.angle >= 0) {
        var rotation = Math.PI * p.angle / 180;
    } else {
        var rotation = Math.PI * (360+p.angle) / 180;
    }
    var costheta = Math.round(Math.cos(rotation) * 1000) / 1000;
    var sintheta = Math.round(Math.sin(rotation) * 1000) / 1000;
    //alert(costheta+","+sintheta);

    if (document.all && !window.opera) {
        var canvas = document.createElement('img');

        canvas.src = p.src;
        canvas.height = p.height;
        canvas.width = p.width;

        canvas.style.filter = "progid:DXImageTransform.Microsoft.Matrix(M11="+costheta+",M12="+(-sintheta)+",M21="+sintheta+",M22="+costheta+",SizingMethod='auto expand')";
    } else {
        var canvas = document.createElement('canvas');
        if (!p.oImage) {
            canvas.oImage = new Image();
            canvas.oImage.src = p.src;
        } else {
            canvas.oImage = p.oImage;
        }

        canvas.style.width = canvas.width = Math.abs(costheta*canvas.oImage.width) + Math.abs(sintheta*canvas.oImage.height);
        canvas.style.height = canvas.height = Math.abs(costheta*canvas.oImage.height) + Math.abs(sintheta*canvas.oImage.width);

        var context = canvas.getContext('2d');
        context.save();
        if (rotation <= Math.PI/2) {
            context.translate(sintheta*canvas.oImage.height,0);
        } else if (rotation <= Math.PI) {
            context.translate(canvas.width,-costheta*canvas.oImage.height);
        } else if (rotation <= 1.5*Math.PI) {
            context.translate(-costheta*canvas.oImage.width,canvas.height);
        } else {
            context.translate(0,-sintheta*canvas.oImage.width);
        }
        context.rotate(rotation);
        context.drawImage(canvas.oImage, 0, 0, canvas.oImage.width, canvas.oImage.height);
        context.restore();
    }
    canvas.id = p.id;
    canvas.angle = p.angle;
    p.parentNode.replaceChild(canvas, p);
}

jQuery.fn.rotateRight = function(angle) {
    this.rotate(angle==undefined?90:angle);
}

jQuery.fn.rotateLeft = function(angle) {
    this.rotate(angle==undefined?-90:-angle);
}