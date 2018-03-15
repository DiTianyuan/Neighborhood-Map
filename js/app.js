var map,
    markers = [],
    locations = ko.observableArray([
        { title: '西溪湿地公园', location: {lat: 30.268056, lng: 120.06629} },
        { title: '灵隐寺', location: {lat: 30.246569, lng: 120.10826} },
        { title: '西湖', location: {lat: 30.242701, lng: 120.15027} },
        { title: '九溪烟树', location: {lat: 30.20296, lng: 120.120121} },
        { title: '宋城景区', location: {lat: 30.175961, lng: 120.105205} },
        { title: '湘湖', location: {lat: 30.134824, lng: 120.217373} }
    ]);

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 30.274084, lng: 120.15507 },
        zoom: 11
    });

    var largeInfowindow = new google.maps.InfoWindow();
    var bounds = new google.maps.LatLngBounds();

    // 遍历地点，为每个地点创建marker
    for (var i = 0; i < locations().length; i++) {
        var position = locations()[i].location;
        var title = locations()[i].title;
        var marker = new google.maps.Marker({
            map: map,
            position: position,
            title: title,
            animation: google.maps.Animation.DROP,
            id: i
        });
        markers.push(marker);

        // 点击marker，其上下跳动并显示相应地点详情
        marker.addListener('click', function() {
            shakeMarker(this);
            populateInfoWindow(this, largeInfowindow);
        });
        bounds.extend(markers[i].position);
    }

    //点击列表中的地点，相应marker上下跳动并显示地点详情
    $('#places-list').click(function(evt) {
        var placeTitle = $(evt.target).text();
        for(marker of markers) {
            if(marker.title == placeTitle) {
                shakeMarker(marker);
                populateInfoWindow(marker, largeInfowindow);
            }
        }
    });

    map.fitBounds(bounds);
}

// marker上下跳动1.5秒的函数
function shakeMarker(marker) {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function() {
        marker.setAnimation(google.maps.Animation.null);
    }, 1500);
}

// 填充信息窗的函数
function populateInfoWindow(marker, infowindow) {
    if (infowindow.marker != marker) {
        infowindow.marker = marker;
        infowindow.setContent(`<div><strong>${marker.title}</strong></div><div id="photo"></div><div id="news"></div>`);
        infowindow.open(map, marker);
        infowindow.addListener('closeclick', function() {
            infowindow.setMarker = null;
        });

        // 从Flickr异步请求图片
        $.ajax(`https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=028074b132e99019151a8a115c51c831&tags=${marker.title}&tag_mode=all&media=photos&10&format=json&jsoncallback=?`, {
            dataType: 'jsonp',
            jsonp: 'jsoncallback',
        }).done(addImage)
        .fail(requestError);

        // 请求成功调用此函数
        function addImage(data) {
            let htmlContent = '';
            const firstImage = data.photos.photo[0]; // 获取第一张图片

            // 若第一张图片存在则将其添加到信息窗，若不存在则在信息窗显示提示信息
            if (firstImage) {
                htmlContent = `<figure>
                    <img src="https://farm${firstImage.farm}.staticflickr.com/${firstImage.server}/${firstImage.id}_${firstImage.secret}_m.jpg" alt="${marker.title}">
                    <figcaption>${firstImage.title}</figcaption>
                </figure>`;
            } else {
                htmlContent = `<span aria-hidden="true" data-icon="&#x26a0;"></span>
                    <span>没有找到相关图片。</span>`;
            }
            document.getElementById('photo').innerHTML = htmlContent;
        }

        // 请求失败调用此函数，在控制台输出错误，并在信息窗显示“请求失败”
        function requestError(xhr, status, error) {
            console.log(status);
            console.log(error);
            document.getElementById('photo').innerHTML = `<p class="network-warning">
                <span aria-hidden="true" data-icon="&#x26a0;"></span>
                <span>请求失败！</span>
            </p>`;
        }
    }
}

var ViewModel = function() {
    // 在输入框输入字符，将清空li列表，隐藏所有marker，对比字符与每个marker.title（及相应location.title），若符合则添加li并显示其marker
    this.searchPlace = function() {
        $("#places-list").empty();
        var a = $("#places-input-box").val();
        for(marker of markers) {
            marker.setMap(null);
            var s = marker.title;
            if(s.includes(a)) {
                document.getElementById('places-list').innerHTML += `<li class="place"><strong>${s}</strong></li>`;
                marker.setMap(map);
            }
        }
    }
}

ko.applyBindings(new ViewModel());
