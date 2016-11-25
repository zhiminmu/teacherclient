        var myconnect=function(){
            var adapter=Object.create(ConfAdapter);
            companyId=sessionStorage.getItem("corporateAccount");
            ROOM_JID=sessionStorage.getItem("conferenceID");
            usernameid=sessionStorage.userName;
            Fromusername=usernameid+"_"+companyId;
            userpass=sessionStorage.password;
            serverIp="120.25.73.123";
            var openfireurl=window.location.protocol;
            if(openfireurl==="https:")
                adapter.connection = new Openfire.Connection("wss://"+serverIp+":7443/ws/server");
            else{
                adapter.connection = new Openfire.Connection("ws://"+serverIp+":7070/ws/server");    }
            adapter.connection.connect(Fromusername,userpass,onConnect);
        }
        var onConnect=function(status) {
            if (status == Strophe.Status.CONNECTING) {
            } else if (status == Strophe.Status.CONNFAIL) {
                      alert('Strophe failed to connect.');
                    $('#connect').get(0).value = 'connect';
            } else if (status == Strophe.Status.DISCONNECTING) {
            } else if (status == Strophe.Status.DISCONNECTED) {
                    alert('信息不正确，请重新填写');
            }else if (status == Strophe.Status.CONNECTED) {
                // window.location.href="../webplayteacher.html?"
                // +"userName="+escape(sessionStorage.userName)
                // +"&companyId="+escape(sessionStorage.corporateAccount)
                // +"&conferenceID="+escape(sessionStorage.conferenceID)
                // +"&password="+escape(sessionStorage.password);
                // return false;
                // window.open("../webplayteacher.html");
                $("#rel-submit").trigger('click'); 
            }
        }
        jQuery(document).ready(function($) {
            $("#submit").click(function(event) {
                if (window.localStorage) {
                    var userNameStr = $("#userNameInput").val();
                    var companyId = $("#corporateAccountInput").val();
                    var conferenceIDStr = $("#conferenceIDInput").val();
                    var passwordStr = $("#passwordInput").val();
                    sessionStorage["userName"] = userNameStr;
                    sessionStorage["corporateAccount"] = companyId;
                    sessionStorage["conferenceID"] = conferenceIDStr;
                    sessionStorage["password"] = passwordStr;
                }else{
                    alert("不支持sessionStorage");
                }
                myconnect();
            });
        });
                