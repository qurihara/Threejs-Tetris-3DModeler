if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = ( function () {
        return window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
                window.setTimeout(callback, 1000 / 60);
            };
    })();
}

window.Tetris = window.Tetris || {};
Tetris.sounds = {};

Tetris.init = function () {
    Tetris.sounds["theme"] = document.getElementById("audio_theme");  
    Tetris.sounds["collision"] = document.getElementById("audio_collision");  
    Tetris.sounds["move"] = document.getElementById("audio_move");  
    Tetris.sounds["gameover"] = document.getElementById("audio_gameover");  
    Tetris.sounds["score"] = document.getElementById("audio_score");  

    Tetris.sounds["theme"].play();
    // set the scene size
    var WIDTH = window.innerWidth,
        HEIGHT = window.innerHeight;

    // set some camera attributes
    var VIEW_ANGLE = 45,
        ASPECT = WIDTH / HEIGHT,
        NEAR = 0.1,
        FAR = 10000;

    // create a WebGL renderer, camera
    // and a scene
    Tetris.renderer = new THREE.WebGLRenderer();
    Tetris.camera = new THREE.PerspectiveCamera(VIEW_ANGLE,
        ASPECT,
        NEAR,
        FAR);
    Tetris.scene = new THREE.Scene();

    // the camera starts at 0,0,0 so pull it back
    Tetris.camera.position.z = 600;
    Tetris.scene.add(Tetris.camera);

    // start the renderer
    Tetris.renderer.setSize(WIDTH, HEIGHT);

    // attach the render-supplied DOM element
    document.body.appendChild(Tetris.renderer.domElement);

    // configuration object
    var boundingBoxConfig = {
        width:360,
        height:360,
        depth:1200,
        splitX:10,
        splitY:10,
        splitZ:20
    };
    Tetris.boundingBoxConfig = boundingBoxConfig;
    Tetris.blockSize = boundingBoxConfig.width / boundingBoxConfig.splitX;

    Tetris.Board.init(boundingBoxConfig.splitX, boundingBoxConfig.splitY, boundingBoxConfig.splitZ);

    var boundingBox = new THREE.Mesh(
        new THREE.CubeGeometry(boundingBoxConfig.width, boundingBoxConfig.height, boundingBoxConfig.depth, boundingBoxConfig.splitX, boundingBoxConfig.splitY, boundingBoxConfig.splitZ),
        new THREE.MeshBasicMaterial({ color:0xffaa00, wireframe:true })
    );
    Tetris.scene.add(boundingBox);

    Tetris.renderer.render(Tetris.scene, Tetris.camera);

    Tetris.stats = new Stats();
    Tetris.stats.domElement.style.position = 'absolute';
    Tetris.stats.domElement.style.top = '100px';
    Tetris.stats.domElement.style.left = '10px';
    document.body.appendChild(Tetris.stats.domElement);

    document.getElementById("play_button").addEventListener('click', function (event) {
        event.preventDefault();
        Tetris.start();
    });
};

Tetris.start = function () {
    document.getElementById("menu").style.display = "none";
    Tetris.pointsDOM = document.getElementById("points");
    Tetris.pointsDOM.style.display = "block";
	
    Tetris.sounds["theme"].pause();
	
    Tetris.Block.generate();
    Tetris.animate();
};

Tetris.gameStepTime = 1000;

Tetris.frameTime = 0; // ms
Tetris.cumulatedFrameTime = 0; // ms
Tetris._lastFrameTime = Date.now(); // timestamp

Tetris.gameOver = false;

Tetris.animate = function () {
    var time = Date.now();
    Tetris.frameTime = time - Tetris._lastFrameTime;
    Tetris._lastFrameTime = time;
    Tetris.cumulatedFrameTime += Tetris.frameTime;

    while (Tetris.cumulatedFrameTime > Tetris.gameStepTime) {
        Tetris.cumulatedFrameTime -= Tetris.gameStepTime;
        Tetris.Block.move(0, 0, -1);
    }

    Tetris.renderer.render(Tetris.scene, Tetris.camera);

    Tetris.stats.update();

    if (!Tetris.gameOver) window.requestAnimationFrame(Tetris.animate);
};


// nice test:
// var i = 0, j = 0, k = 0, interval = setInterval(function() {if(i==6) {i=0;j++;} if(j==6) {j=0;k++;} if(k==6) {clearInterval(interval); return;} Tetris.addStaticBlock(i,j,k); i++;},30)

Tetris.staticBlocks = [];
Tetris.zColors = [
    0x6666ff, 0x66ffff, 0xcc68EE, 0x666633, 0x66ff66, 0x9966ff, 0x00ff66, 0x66EE33, 0x003399, 0x330099, 0xFFA500, 0x99ff00, 0xee1289, 0x71C671, 0x00BFFF, 0x666633, 0x669966, 0x9966ff
];
Tetris.addStaticBlock = function (x, y, z) {
    if (Tetris.staticBlocks[x] === undefined) Tetris.staticBlocks[x] = [];
    if (Tetris.staticBlocks[x][y] === undefined) Tetris.staticBlocks[x][y] = [];

    var mesh = THREE.SceneUtils.createMultiMaterialObject(new THREE.CubeGeometry(Tetris.blockSize, Tetris.blockSize, Tetris.blockSize), [
        new THREE.MeshBasicMaterial({color:0x000000, shading:THREE.FlatShading, wireframe:true, transparent:true}),
        new THREE.MeshBasicMaterial({color:Tetris.zColors[z]})
    ]);

    mesh.position.x = (x - Tetris.boundingBoxConfig.splitX / 2) * Tetris.blockSize + Tetris.blockSize / 2;
    mesh.position.y = (y - Tetris.boundingBoxConfig.splitY / 2) * Tetris.blockSize + Tetris.blockSize / 2;
    mesh.position.z = (z - Tetris.boundingBoxConfig.splitZ / 2) * Tetris.blockSize + Tetris.blockSize / 2;

    Tetris.scene.add(mesh);
    Tetris.staticBlocks[x][y][z] = mesh;
};

Tetris.currentPoints = 0;
Tetris.addPoints = function (n) {
    Tetris.currentPoints += n;
    Tetris.pointsDOM.innerHTML = Tetris.currentPoints;
    Cufon.replace('#points');
    Tetris.sounds["score"].play();
};

var offset = 10;
Tetris.addCubeStl = function(x,y,z){
    var st = "";    
    var lines = cubeStl.split("\n");
    for(var i=0;i<lines.length;i++){
//        if (lines[i].length == 0) continue;
        if (lines[i].indexOf("vertex")>-1){
            var eles = lines[i].split(' ');
            st += "vertex " + String(parseFloat(eles[1])+x*offset) + " " + String(parseFloat(eles[2])+y*offset) + " " + String(parseFloat(eles[3])+z*offset) + "\n";
        }else{
            st += lines[i] + "\n";
        }
    }
    return st;
};

Tetris.print3d = function(){    
    //alert(Tetris.Board.fields.length + "," + Tetris.Board.fields[0].length + "," + Tetris.Board.fields[0][0] );
    var str = "solid cube-ascii\n";
    for (var x = 0; x < Tetris.Board.fields.length; x++) {
        for (var y = 0; y < Tetris.Board.fields[x].length; y++) {
            for (var z = 0; z < Tetris.Board.fields[x][y].length; z++) {
                if (Tetris.Board.fields[x][y][z] == Tetris.Board.FIELD.PETRIFIED){
                    str += Tetris.addCubeStl(x,y,z);
                }
            }
        }
    }
    str += "endsolid\n";
    exportStl("download", str);    
    alert("3D model exported. Add .stl to its filename.");    
};

exportStl = function(id,content){
    if (window.File) {
//      window.alert("File APIが実装されてます。");
    } else {
      window.alert("本ブラウザではFile APIが使えません");
    }

    var blob = new Blob([ content ], { "type" : "application/x-msdownload" });
     window.URL = window.URL || window.webkitURL;
     var url = window.URL.createObjectURL(blob);
    $("#" + id).attr("href", url);
    $("#" + id).attr("download", "model.stl");
    window.open(url,"_blank");
};

//ヒアドキュメント
var cubeStl = (function () {/*facet normal 0 0 1
outer loop
vertex 0 0 10
vertex 10 0 10
vertex 0 10 10
endloop
endfacet
facet normal 0 0 1
outer loop
vertex 10 10 10
vertex 0 10 10
vertex 10 0 10
endloop
endfacet
facet normal 1 0 0
outer loop
vertex 10 0 10
vertex 10 0 0
vertex 10 10 10
endloop
endfacet
facet normal 1 0 0
outer loop
vertex 10 10 0
vertex 10 10 10
vertex 10 0 0
endloop
endfacet
facet normal 0 0 -1
outer loop
vertex 10 0 0
vertex 0 0 0
vertex 10 10 0
endloop
endfacet
facet normal 0 0 -1
outer loop
vertex 0 10 0
vertex 10 10 0
vertex 0 0 0
endloop
endfacet
facet normal -1 0 0
outer loop
vertex 0 0 0
vertex 0 0 10
vertex 0 10 0
endloop
endfacet
facet normal -1 0 0
outer loop
vertex 0 10 10
vertex 0 10 0
vertex 0 0 10
endloop
endfacet
facet normal 0 1 0
outer loop
vertex 0 10 10
vertex 10 10 10
vertex 0 10 0
endloop
endfacet
facet normal 0 1 0
outer loop
vertex 10 10 0
vertex 0 10 0
vertex 10 10 10
endloop
endfacet
facet normal 0 -1 0
outer loop
vertex 10 0 10
vertex 0 0 10
vertex 10 0 0
endloop
endfacet
facet normal 0 -1 0
outer loop
vertex 0 0 0
vertex 10 0 0
vertex 0 0 10
endloop
endfacet*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

window.addEventListener("load", Tetris.init);

window.addEventListener('keydown', function (event) {
    var key = event.which ? event.which : event.keyCode;

    switch (key) {
        //case
        case 27: // esc
            Tetris.print3d();
            break;
        case 38: // up (arrow)
            Tetris.Block.move(0, 1, 0);
            break;
        case 40: // down (arrow)
            Tetris.Block.move(0, -1, 0);
            break;
        case 37: // left(arrow)
            Tetris.Block.move(-1, 0, 0);
            break;
        case 39: // right (arrow)
            Tetris.Block.move(1, 0, 0);
            break;
        case 32: // space
            Tetris.Block.move(0, 0, -1);
            break;

        case 87: // up (w)
            Tetris.Block.rotate(90, 0, 0);
            break;
        case 83: // down (s)
            Tetris.Block.rotate(-90, 0, 0);
            break;

        case 65: // left(a)
            Tetris.Block.rotate(0, 0, 90);
            break;
        case 68: // right (d)
            Tetris.Block.rotate(0, 0, -90);
            break;

        case 81: // (q)
            Tetris.Block.rotate(0, 90, 0);
            break;
        case 69: // (e)
            Tetris.Block.rotate(0, -90, 0);
            break;
    }
}, false);	

