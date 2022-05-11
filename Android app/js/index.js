
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {

    data_graph_1= [];
    data_graph_2= [];
    values_1=[]
    values_2=[]



//FIREBASE
FirebasePlugin.getToken(function(fcmToken) {
    console.log(fcmToken);

}, function(error) {
    console.error(error);
});
FirebasePlugin.onMessageReceived(function(message) {
    console.log("Message type: " + message);
    if(message.messageType === "notification"){
        received= JSON.parse(message.message)
      
        if(message.tap){

            console.log("Tapped in " + message.tap);
             
        }
    }
    console.log(message);
}, function(error) {
    console.error(error);
});

FirebasePlugin.grantPermission(function(hasPermission){
    console.log("Permission was " + (hasPermission ? "granted" : "denied"));
});

FirebasePlugin.subscribe("/topics/containers", function(){
    console.log("Subscribed to topic");
}, function(error){
     console.error("Error subscribing to topic: " + error);
});
//FIREBASE



//grpahiek
 $("#graphiek1").click(function(){
        show_chart(".chart1","container 1", data_graph_1)
        //alert(Math.min(...values_1))
        var sum1 = values_1.reduce(function(a, b){
            return a + b;
        }, 0);
        av1= sum1/values_1.length
        $("#min1").html(Math.min.apply(Math, values_1))
        $("#max1").html(Math.max.apply(Math, values_1))
        $("#avarage1").html(av1.toFixed(2))
        $('#myModal1').modal('show');
        
    })

    $("#graphiek2").click(function(){
        var sum2 = values_2.reduce(function(a, b){
            return a + b;
        }, 0);
        av2= sum2/values_2.length
        show_chart(".chart2","container 2", data_graph_2)
        $("#min2").html(Math.min.apply(Math, values_2))
        $("#max2").html(Math.max.apply(Math, values_2))
        $("#avarage2").html(av2.toFixed(2))
      

        $('#myModal2').modal('show');
    })


    $("#delete1").click(function(){
        if(confirm("Wil je de data verwijderen?")){
            data_graph_1=[]
            values_1=[]
            remove_container_1()
            setTimeout(function(){
                firestore()
            },1000)
        }
        

    })

    $("#delete2").click(function(){
        if(confirm("Wil je de data verwijderen?")){
            data_graph_2=[]
            values_2=[]
            remove_container_2();
            setTimeout(function(){
                firestore()
            },1000)
            
        }
       

    })
   
//get data from firebase-firestore
     firestore()
    function firestore(){
        FirebasePlugin.createUserWithEmailAndPassword("bert@delibert.com", "password", function() {
           // alert("success");
        }, function(error) {
           //alert(error);
        });

        var documentId = "Koelcontainers";
        var collection = "Delibert";
        FirebasePlugin.fetchDocumentInFirestoreCollection(documentId, collection, function(document){
 
            container_1= document.container_1
            container_2= document.container_2
            last_1= container_1[container_1.length-1]
            last_2= container_2[container_2.length-1]

            if (document.container_1.length>0){
                add_fields("container1", last_1.temp, "container 1")
                $("#update1").html(last_1.date)


                if (document.container_1.length>15){
                    document.container_1= document.container_1.slice(1).slice(-15)
           
                    }
                            for (let i=0; i<document.container_1.length;i++){
                            x= document.container_1[i].temp
                            y= document.container_1[i].date
                            data_graph_1.push({label:y, y:x});
                            values_1.push(x)
                            }
            }

            else {
                add_fields("container1", 0, "container 1")
                
            }



            if (document.container_2.length>0){
                add_fields("container2", last_2.temp, "container 2")
                $("#update2").html(last_2.date)


                if (document.container_2.length>15){
                    document.container_2= document.container_2.slice(1).slice(-15)
                   
                     //data.time= data.time.slice(1).slice(-15)
                    }
                            for (let i=0; i<document.container_2.length;i++){
                            x= document.container_2[i].temp
                            y= document.container_2[i].date
                            data_graph_2.push({label:y, y:x});
                            values_2.push(x)
                            }
            }
            
            else {
                add_fields("container2", 0, "container 2")
                
            }     

        }, function(error){
            console.error("Error fetching document: "+error);
        });


    }
  
    
console.log(data_graph_1)
function remove_container_1(){
    var documentId = "Koelcontainers";
var documentFragment = {
    "container_1": [],

};
var collection = "Delibert";
FirebasePlugin.updateDocumentInFirestoreCollection(documentId, documentFragment, collection, function(){
    console.log("Successfully updated document with id="+documentId);
}, function(error){
    console.error("Error updating document: "+error);
});

}

//delete data
function remove_container_2(){
    var documentId = "Koelcontainers";
var documentFragment = {
    "container_2": [],

};
var collection = "Delibert";
FirebasePlugin.updateDocumentInFirestoreCollection(documentId, documentFragment, collection, function(){
    console.log("Successfully updated document with id="+documentId);
}, function(error){
    console.error("Error updating document: "+error);
});

}


//gauge
function add_fields(field, value=0, label){



    width= $("#"+field).width()+20
    height= $("#"+field).height()


    google.charts.load('current', {'packages':['gauge']});
    google.charts.setOnLoadCallback(drawChart);

    function drawChart() {
    var data = google.visualization.arrayToDataTable([
    ['Label', 'Value'],
    [label, value],
    ]);
    var options = {
    width: width, height: height,
    max: 50,
    min:-25,

    minorTicks: 5
    };

    var chart = new google.visualization.Gauge(document.getElementById(field));


    setTimeout(() => {
      chart.draw(data, options);
    }, 1000);
    }
  }


function show_chart(area,field,chart_data){

    setTimeout(() => {
        $(function() {
    
          
        $(area).CanvasJSChart({
            animationEnabled: true,
            zoomEnabled: true,
            backgroundColor: "#F5DEB3",
            animationEnabled: true,
            height: 200,
            width: $(window ).width()-20,
            title: {
                text: field
            },
            axisY: {
                title: "",
                includeZero: false,
                margin: 3,
            },
            axisX: {
                interval: 1,
                title: "",
            labelAngle: 270
            },
            data: [
            {
                type: "stepLine", //try changing to column, area
               // axisYType: "secondary",
                toolTipContent: "{label}: {y} C°",
                
                dataPoints: chart_data,
                lineColor: "red",
                color: "LightSeaGreen",
            },
            ]
        });
    });
    
    
    }, 2000);

}




$("#noti1").click(function(){
    if ($("#noti1").html()=="Melding AAN"){
        change_notification_status("Koelcontainer_1", false)
        get_notification_status()
    }

    else {
        change_notification_status("Koelcontainer_1", true)
        get_notification_status() 
    }
})


//notification off/on

$("#noti2").click(function(){
    if ($("#noti2").html()=="Melding AAN"){
        change_notification_status("Koelcontainer_2", false)
        get_notification_status()
    }

    else {
        change_notification_status("Koelcontainer_2", true)
        get_notification_status() 
    }
})



get_notification_status()
function get_notification_status(){

    var documentId = "Notification";
var collection = "Delibert";
FirebasePlugin.fetchDocumentInFirestoreCollection(documentId, collection, function(document){
    console.log("Successfully fetched document: "+JSON.stringify(document));
    if (document.Koelcontainer_1==true){
        $("#noti1").html("Melding AAN")

        $("#noti1").css({"background-color":"purple"})
    }
    else{
        $("#noti1").html("Melding UIT")
     
        $("#noti1").css({"background-color":"black"})

      }
    
    if (document.Koelcontainer_2==true){
        $("#noti2").html("Melding AAN")
        $("#noti2").css({"background-color":"purple"})
    }
    else{
        $("#noti2").html("Melding UIT")
        $("#noti2").css({"background-color":"black"})

    
    }

}, function(error){
    console.error("Error fetching document: "+error);
})
}


function change_notification_status(container, value){
    var documentId = "Notification";
    if (container=="Koelcontainer_1") {
        var documentFragment = {
            "Koelcontainer_1":value
        };
    }
    else {
        var documentFragment = {
            "Koelcontainer_2":value
        };
    }
   
   
    var collection = "Delibert";
    FirebasePlugin.updateDocumentInFirestoreCollection(documentId, documentFragment, collection, function(){
        console.log("Successfully updated document with id="+documentId);
    }, function(error){
        console.error("Error updating document: "+error);
    });


}

}
