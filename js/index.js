var ajax=(function($){

        var _photo_uri;
        var imgur_client_id = "1841367133e3c0151755f5632959b990";
        var instagram_client_id = "fc8041d4af1544a2939c3f5a9a1ef8cf";
      function started(){

        $("#map").live("pagecreate", function() {           
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    locationSuccess,locationError,
                    {enableHighAccuracy: true });
            }  
        });

        $("#list").live("pageshow", function() {
            getPhotos();
        });
        
        $(document).on('click', '[data-role="navbar"] a', function () {
            $.mobile.changePage($(this).attr("data-href"), {
                transition: "none",
                changeHash: false
            });         
            return false;
        });
      }

        function getPhotos() {          
            var map_visible = $("#map").is(':visible');
            var list_visible = $("#list").is(':visible');

            if (map_visible) {
                tag = $("#map .tag").val();
            } else if (list_visible) {
                tag = $("#list .tag").val();
            }

            if (tag == "") {
                tag = "instafood";
            }

            tag = tag.replace(/(#| )/g,"");

            $(".search-button").addClass('ui-disabled');
            $(".result-count").html("cargando...");
            if (map_visible) {
                $.mobile.loading( 'show');
                $('#map_canvas').gmap('clear', 'markers');
            } else if (list_visible) {
                $.mobile.loading( 'show', {
                    text: 'Cargando Instagram',
                    textVisible: true,
                    theme: 'b'
                });
                $("#element_list").empty();
            }

            var url = "https://api.instagram.com/v1/tags/" + tag + "/media/recent?client_id=" + instagram_client_id + "&callback=?";
            
            $.getJSON(url, function(data) {
                var data_elements = data["data"];
                var showing = 0;
                $.each(data_elements, function(index, current_element) {
                    var thumbnail = current_element["images"]["thumbnail"]["url"];
                    var caption = "ver imagen";
                    
                    if (current_element["caption"] != null) {
                        caption = current_element["caption"]["text"];
                    }

                    var link = current_element["link"];

                    if (map_visible && current_element["location"] != null) {
                        showing++;
                        var lat = current_element["location"]["latitude"];                                              
                        var lng = current_element["location"]["longitude"];
                        var position = new google.maps.LatLng(lat,lng);
                    
                        var info_window = $('<span>').append(
                                            $('<img>').attr('src',thumbnail)).append(
                                                $('<br>')).append(
                                                    $('<a>').attr('href',link).text(caption)).html();                   
                        $('#map_canvas').gmap('addMarker', {'position': position}).click(function(){
                             $('#map_canvas').gmap('openInfoWindow', {'content': info_window}, this);
                             $('#map_canvas').gmap('getMap').panTo(position);
                        });                     
                    } else if (list_visible) {
                        showing++;
                        $("#element_list").append(
                            $('<li>').append(
                                $('<a>').attr('href',link).append(
                                    $('<img>').attr('src',thumbnail)).append(caption))
                        );
                    }
                });
                if (list_visible) {
                    $("#element_list").listview("refresh");
                    $.mobile.loading( 'hide');
                }else if (map_visible) {

                    $.mobile.loading( 'hide');
                };
                $(".search-button").removeClass('ui-disabled');
                $(".result-count").html("Mostrando " + showing + " resultados para #" + tag);
            });
            

        }


        function takePhoto() {
            var opts = { 
                targetWidth: 300, 
                targetHeight: 300, 
                destinationType : Camera.DestinationType.FILE_URI
            }
        
            navigator.camera.getPicture(function(imageURI) {
                                            _photo_uri = imageURI;
                                            $("#pic").attr("src",_photo_uri);
                                        }, 
                                        function(error){
                                                $("#picinfo").html("error " + error.code);
                                        }, opts)
        }       

        function uploadPhoto() {
              var opts = new FileUploadOptions();
              opts.fileKey  = "image";
              opts.fileName = _photo_uri.substr(_photo_uri.lastIndexOf('/')+1);
              opts.mimeType = "image/jpeg";
              opts.params   = {"type":"file","key":imgur_client_id};
              var ft = new FileTransfer();
              ft.upload(_photo_uri, "http://api.imgur.com/3/upload.json",

                              function(resp) {                              
                                var link = jQuery.parseJSON(resp.response).data.link;
                                $("#picinfo").html($("<a>").attr("href",link).text("imagen publicada en " + link));
                              },            
                             function(error) {
                                $("#picinfo").html("no fue posible publicar " + error.code);
                              }, opts);

        }       

        function locationSuccess(position){         
            var lat = position.coords.latitude;                     
            var lng = position.coords.longitude;    
            $('#map_canvas').gmap({ 'center': new google.maps.LatLng(lat, lng), 'zoom': 13});
            getPhotos();
        }
        
        function locationError(error) {
              $.mobile.loading( 'show', {
                    text: 'no es culpa tuya es nuestra intentalo conectado a internet',
                    textVisible: true,
                    theme: 'd'
                });
            $('#map_canvas').gmap({'zoom': 2});
            getPhotos();
        }







  return{
    inicio:started,
    cargarFotos:getPhotos
  }
              
})(jQuery);

(function() {

    
    ajax.inicio();
      $(document).on('click', 'a,[data-role="listview"] a,[data-role="navbar"] a', function () {
              $.mobile.changePage($(this).attr("data-href"), {
                    transition: "none",
                    changeHash: false
              }); 
            return false;
        });
    $(document).on("pageloadfailed", function(event, data){
        event.preventDefault();

        var errMessage = data.xhr.status + " " + data.xhr.statusText;

        setTimeout(function(){
            $.mobile.loading('hide');
            $.mobile.loading('show', {theme:"e", text:errMessage, textonly:true, textVisible: true});
        },50);

        setTimeout(function(){$.mobile.loading('hide')}, 2000);

        data.deferred.reject(data.absUrl, data.options);
    });
}).call(this);


