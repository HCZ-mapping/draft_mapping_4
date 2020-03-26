/* global L, carto, option, input */

(function() {

  var inputForDrop;

  var map = L.map("map", { maxZoom: 19 }).setView([40.813, -73.968334], 14);

  populateDropDown();
  
        var satellite = L.tileLayer('https://api.mapbox.com/styles/v1/nicostettler/cjzvo7sg502641csqbotfm55j/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1Ijoibmljb3N0ZXR0bGVyIiwiYSI6ImNqc3lweWFmOTE1cDc0OW9iZGYzbHNyNGoifQ.BgZ8GQky4xAHBlL-Pi8MiQ', {maxZoom: 22, attribution: "Map data &copy; <a href='http://hcz.org'>Harlem Children's Zone</a>"});
        var voyager = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}.png', {maxZoom: 22, attribution: "Map data &copy; <a href='http://hcz.org'>Harlem Children's Zone</a>"});
        var osm = L.tileLayer('https://c.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 22, attribution: "Map data &copy; <a href='http://hcz.org'>Harlem Children's Zone</a>"});
        var light = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png', {maxZoom: 22, attribution: "Map data &copy; <a href='http://hcz.org'>Harlem Children's Zone</a>"});

        satellite.addTo(map);

        var basemaps = {
          'Satellite': satellite,
          'Standard': voyager,
          'Open Street Map': osm,
          'Light': light
        };

        L.control.layers(basemaps).setPosition('bottomleft').addTo(map);
  
  var client = new carto.Client({
    apiKey: "default_public",
    username: "yassida"
    
  });

  // ************************************************** Point LAYER *********************************************************
  const pointSource = new carto.source.SQL(`
            SELECT * FROM hcz_finaldata
        `);
  
  const pointStyle = new carto.style.CartoCSS(`
            #layer {
              marker-width: 25;
              marker-fill: red;
              marker-file: url('https://s3.amazonaws.com/com.cartodb.users-assets.production/production/vonwildsau/assets/20190916172035hczMarkerCenter.svg');
              marker-fill-opacity: 1;
              marker-allow-overlap: true;
              marker-line-width: 2;
              marker-line-color: #ffffff;
              marker-line-opacity: 1;
              marker-comp-op: multiply    ;
              [zoom >= 16] {marker-width: 35;}

/* Making Points disappear @<17zoom           

            [site="West Side Community Center"] [zoom < 17] {marker-fill-opacity: 0; marker-line-width: 0;}
            [site="Countee Cullen Beacon (Middle School)"] [zoom < 17] {marker-fill-opacity: 0; marker-line-width: 0;}
            [site="Promise Academy I Charter School (High School)"] [zoom < 17] {marker-fill-opacity: 0; marker-line-width: 0;}
            [site="PS 76 - Peacemakers (Middle School)"] [zoom < 17] {marker-fill-opacity: 0; marker-line-width: 0;}
            [site="Harlem Gems UPK"] [zoom < 17] {marker-fill-opacity: 0; marker-line-width: 0;}
            [site="PS 149 - Peacemakers (Middle School)"] [zoom < 17] {marker-fill-opacity: 0; marker-line-width: 0;}
            [site="Lincoln Community Center (Elementary)"] [zoom < 17] {marker-fill-opacity: 0; marker-line-width: 0;}
            [site="St. Nicholas Community Center (Elementary)"] [zoom < 17] {marker-fill-opacity: 0; marker-line-width: 0;}
            [site="Promise Academy II Charter School (Middle School)"] [zoom < 17] {marker-fill-opacity: 0; marker-line-width: 0;}
            [site="Promise Academy II Charter School (High School)"] [zoom < 17] {marker-fill-opacity: 0; marker-line-width: 0;}

 Making Points disappear @<18zoom 

            [site="Baby College"] [zoom < 18] {marker-fill-opacity: 0; marker-line-width: 0;}
            [site="Family Support Center"] [zoom < 18] {marker-fill-opacity: 0; marker-line-width: 0;}  
*/ 

/* Coloring Points */
            [type="Parenting"] {marker-fill: #b50231;}
            [type="Early Childhood"] {marker-fill: #8064A2;} 
            [type="Elementary School"] {marker-fill: #f79646;}
            [type="Middle School"] {marker-fill: #FF66FF;}
            [type="High School"] {marker-fill: #00b0f0;}
            [type="College"] {marker-fill: #190D71;}
            [type="Family and Community"] {marker-fill: #00B050;}

            }
        `);
  
  const pointLayer = new carto.layer.Layer(pointSource, pointStyle, {
    featureClickColumns: [
      "site",
      "the_geom",
      "bin",
    //***  s
      "type",
      "add",
      "link",
      "latitude",
      "longitude",
      "getdirections",
      "photo"
    ]
  });

  // *************************************************** POLYGON LAYER ******************************************************************

  const polySource = new carto.source.SQL(`
            SELECT * FROM finalbuildings
        `);
  
  const polyStyle = new carto.style.CartoCSS(`
            #layer {
              polygon-fill: #009aff;
              polygon-opacity: 0;
              [zoom > 16] {polygon-opacity: 0}
            ::outline {
              line-color: #f9d20c;
              line-width: 3;
              line-opacity: 1;
              line-dasharray: 1, 0;
              line-cap: round;
              [zoom < 17] {line-width: 0}
              }
            }
        `);
  
  const polyLayer = new carto.layer.Layer(polySource, polyStyle, {
    featureClickColumns: ["bin"]
  });

  // ****************************************** HCZ Boundary LAYER **************************************************************

  const boundarySource = new carto.source.Dataset("hczboundary");

  const boundaryStyle = new carto.style.CartoCSS(`
    #layer {
      polygon-fill: #ffffff;
      polygon-opacity: 0;
      }    
    #layer::outline {
      line-width: 5;
      line-color: #f9d20c;
      line-opacity: 0.8;
      }
`);

  const boundaryLayer = new carto.layer.Layer(boundarySource, boundaryStyle);

  // ****************************************** THIRD LAYER: HCZ INVERTED Boundary **************************************************

  var geojson;

  $.getJSON(
    "https://cdn.glitch.com/8dca7616-ca8f-4ca1-b8f4-2dce1973abc9%2Fboundary.geojson?1555981242638",
    function(data) {
      geojson = L.geoJson(data, {
        invert: true,

        style: {
          color: "black",
          stroke: false,
          fillOpacity: 0.5,
          interactive: false
        }
      }).addTo(map);
    }
  );

  // ********************* add CARTO layer to the client and get tile from client and add them to the map object **************************

  client.addLayers([boundaryLayer, polyLayer, pointLayer]);
  client
    .getLeafletLayer()
    .setZIndex(500)
    .addTo(map);

  // ****************************** Adding Feature Content IN THE SIDEBAR WHEN FEATURE IS CLICKED *****************************************

  map.on("click", function(e) {
    var pixelPosition = e.layerPoint;
    var latLng = map.layerPointToLatLng(pixelPosition);
    console.log("LatLng = " + latLng);
    var sidebar = document.querySelector(".sidebar-feature-content");
    pointLayer.on("featureClicked", function(event) {
      var content = '<br><div class="schoolBox">';
      content += "<h1>" + event.data["site"] + "</h1><hr>";
      content += "<h3><b>Type: </b>" + event.data["type"] + "</h3>";
      content += "<h3><b>Address: </b>" + event.data["add"] + "</h3><hr>";
      content +=
        "<h3><b>" +
        "<a href=" +
        event.data["link"] +
        ' target= "_blank">Learn More</a></b></h3>';
      content +=
        "<h3><b>" +
        "<a href=" +
        event.data["getdirections"] +
        ' target= "_blank">Get Directions</a></b></h3>';
      content += '<hr><img src="' + event.data["photo"] + '">';
      content += "</div>";
      sidebar.innerHTML = content;
      // opening the sidebar
      document.getElementById("mySidenav").style.width = "calc(100vw - 42px)";
      document.getElementById("mySidenav").style.maxWidth = "460px";
      document.getElementById("openbtn").style.display = "none";
      document.getElementById("openBoundingBox").style.display = "none";
      console.log("Zoom level: " + map.getZoom());
      map.setView(
        [event.data["latitude"], event.data["longitude"] + 0.0004],
        19
      );
    });
  });

  // ************************************** Filter Program TYPE by Checkboxes ******************************************

  function handleCheckboxChange() {
    var parentCheckbox = document.querySelector(".parent")
    var childCheckbox = document.querySelector(".child");
    var elemenCheckbox = document.querySelector(".elemen");
    var middleCheckbox = document.querySelector(".middle");
    var highCheckbox = document.querySelector(".high");
    var collegeCheckbox = document.querySelector(".college");
    var famCheckbox = document.querySelector(".fam");

    // Logging out to make sure we get the checkboxes correctly
    
    console.log("S_Parenting:", parentCheckbox.checked);
    console.log("S_Early Childhood:", childCheckbox.checked);
    console.log("S_Elementary:", elemenCheckbox.checked);
    console.log("S_Middle School:", middleCheckbox.checked);
    console.log("S_High School:", highCheckbox.checked);
    console.log("S_College:", collegeCheckbox.checked);
    console.log("S_Family:", famCheckbox.checked);

    // Create an array of all of the values corresponding to checked boxes. If a checkbox is checked, add that filter value to our array.

    var type = [];
    map.setView([40.811, -73.934334], 15);
    sidebar.innerHTML = " ";
    
    if (parentCheckbox.checked) {type.push("'Parenting'");}
    if (childCheckbox.checked) {type.push("'Early Childhood'");}
    if (elemenCheckbox.checked) {type.push("'Elementary School'");}
    if (middleCheckbox.checked) {type.push("'Middle School'");}
    if (highCheckbox.checked) {type.push("'High School'");}
    if (collegeCheckbox.checked) {type.push("'College'");}
    if (famCheckbox.checked) {type.push("'Family and Community'");}

    // create a variable here which contains all the options below   
    
    if (type.length) {
      var sql =
        "SELECT * FROM hcz_finaldata WHERE type IN (" +
        type.join(",") +
        ")";
      console.log("Program: " + sql);
      pointSource.setQuery(sql);
      var inputSQL =
        "%20WHERE type IN (" +
        type.join(",") +
        ")";
     
    } else {
      var sql_3 = "SELECT * FROM hcz_finaldata"
      pointSource.setQuery(sql_3);
      var inputSQL_3 = "";
    }
    var sql_output = inputSQL || inputSQL_3;
    inputForDrop = sql_output;
    console.log("input: " + inputForDrop);

    populateDropDown();
  }

  // Listen for changes on any checkbox*/

  var parentCheckbox = document.querySelector(".parent");
  parentCheckbox.addEventListener("change", function() {
    handleCheckboxChange();
  });
  var childCheckbox = document.querySelector(".child");
  childCheckbox.addEventListener("change", function() {
    handleCheckboxChange();
  });
  var elemenCheckbox = document.querySelector(".elemen");
  elemenCheckbox.addEventListener("change", function() {
    handleCheckboxChange();
  });
  var middleCheckbox = document.querySelector(".middle");
  middleCheckbox.addEventListener("change", function() {
    handleCheckboxChange();
  });
  var highCheckbox = document.querySelector(".high");
  highCheckbox.addEventListener("change", function() {
    handleCheckboxChange();
  });
  var collegeCheckbox = document.querySelector(".college");
  collegeCheckbox.addEventListener("change", function() {
    handleCheckboxChange();
  });
   var famCheckbox = document.querySelector(".fam");
  famCheckbox.addEventListener("change", function() {
    handleCheckboxChange();
  });
  

  // *********************************** NEW DROPDOWN MENU **************************************************
  
  function populateDropDown() {
    if (typeof inputForDrop !== "undefined" && inputForDrop !== "null") {
      console.log("The input is working: " + inputForDrop);
      return fetch(
        "https://yassida.carto.com/api/v2/sql?&q=SELECT site FROM hcz_finaldata" +
          inputForDrop +
          ""
      )
        .then(response => response.json())
        .then(response => {
          console.log(response);
          return response["rows"].map(function(feature) {
            option = document.createElement("option");
            option.setAttribute("value", feature.site);
            option.textContent = feature.site;
            document.getElementById("js-select-drop").removeChild(option);
            document.getElementById("js-select-drop").appendChild(option);
          });
        })
        .catch(error => {
          console.log(error);
        });
    } else {
      return fetch(
        "https://yassida.carto.com/api/v2/sql?&q=SELECT site FROM hcz_finaldata"
      )
        .then(response => response.json())
        .then(response => {
          console.log(response);
          return response["rows"].map(function(feature) {
            option = document.createElement("option");
            option.setAttribute("value", feature.site);
            option.textContent = feature.site;
            document.getElementById("js-select-drop").appendChild(option);
          });
        })
        .catch(error => {
          console.log(error);
        });
    }
  }

  // ***************************************** THIS IS DROPDOWN MENU ***************************************************

  var sidebar = document.querySelector(".sidebar-feature-content");
  document
    .getElementById("js-select-drop")
    .addEventListener("change", function(event) {
      input = event.currentTarget.selectedOptions[0].attributes[0].value;
      return fetch(
        `https://yassida.carto.com/api/v2/sql?&q=SELECT * FROM hcz_finaldata where site like '${input}'`
      )
        .then(response => response.json())
        .then(response => {
          return response["rows"].map(function(feature) {
            console.log(feature["site"]);
            map.setView(
              [feature["latitude"], feature["longitude"] + 0.0004],
              19
            );

            //           this is the data for the sidebar
            var content = '<br><div class="schoolBox">';
            content += "<h1>" + feature["site"] + "</h1><hr>";
            content += "<h3><b>Program Type: </b>" + feature["type"] + "</h3>";
            content += "<h3><b>Address: </b>" + feature["add"] + "</h3><hr>";
            content +=
              "<h3><b>" +
              "<a href=" +
              feature["link"] +
              ' target= "_blank">Learn More</a></b></h3>';
            content +=
              "<h3><b>" +
              "<a href=" +
              feature["getdirections"] +
              ' target= "_blank">Get Directions</a></b></h3><hr>';
            content += '<img src="' + feature["photo"] + '"' + ">";
            content += "</div>";
            sidebar.innerHTML = content;

            // this opens the sidebar
            document.getElementById("mySidenav").style.width =
              "calc(100vw - 42px)";
            document.getElementById("mySidenav").style.maxWidth = "480px";
            document.getElementById("openbtn").style.display = "none";
            document.getElementById("openBoundingBox").style.display = "none";
          });
        });
    });

  // ********************************** THIS IS THE MOVING SIDE BAR ************************************

  // This opens the sidebar
  var element = document.getElementById("openbtn");
  element.onclick = function() {
    console.log("OPENED  by javascript");
    document.getElementById("mySidenav").style.width = "calc(100vw - 42px)";
    document.getElementById("mySidenav").style.maxWidth = "480px";
    document.getElementById("openbtn").style.display = "none";
    document.getElementById("openBoundingBox").style.display = "none";
  };

  // this closes the sidebar
  var element = document.getElementById("closebtn");
  element.onclick = function() {
    console.log("this was closed");
    document.getElementById("mySidenav").style.width = "0";
    document.getElementById("openbtn").style.display = "block";
    document.getElementById("openBoundingBox").style.display = "block";
    sidebar.innerHTML = " ";
    map.setView([40.811, -73.944334], 15, {
    });
    document;
  };

  // ************************************ ADDING AN Enter BUTTON ******************************************

  var enterButton = document.querySelector(".enter-screen");
  enterButton.addEventListener("click", function(e) {
    console.log("Zoom Level: " + map.getZoom());
    console.log("Button was clicked");
    map.setView([40.811, -73.934334], 15, {
    });
    document.querySelector(".enter-text").style.display = "none";
    document.querySelector(".enter-screen").style.display = "none";
    map.removeLayer(geojson);
    document.getElementById("mySidenav").style.width = "calc(100vw - 42px)";
    document.getElementById("mySidenav").style.maxWidth = "460px";
    document.getElementById("openbtn").style.display = "none";
    document.getElementById("openBoundingBox").style.display = "none";
  });

  // ************************************ ADDING MOUSE OVER POP-UPS ******************************************

  const popup = L.popup({ closeButton: false });
  pointLayer.on(carto.layer.events.FEATURE_OVER, featureEvent => {
    popup.setLatLng(featureEvent.latLng);
    if (!popup.isOpen()) {
      popup.setContent("<h2>" + featureEvent.data["site"] + "</h2>");
      popup.openOn(map);
    }
  });

  pointLayer.on(carto.layer.events.FEATURE_OUT, featureEvent => {
    popup.removeFrom(map);
  });

  // ********************************* COLLAPSIBLE DIV **************************************

  let myLabels = document.querySelectorAll(".lbl-toggle");

  Array.from(myLabels).forEach(label => {
    label.addEventListener("keydown", e => {
      if (e.which === 32 || e.which === 13) {
        e.preventDefault();
        label.click();
      }
    });
  });
})(); 
