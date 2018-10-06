define([], () => {
  // Thanks to https://stackoverflow.com/questions/3642035/jquerys-append-not-working-with-svg-element
  const svg = {
    makeSvgElement: (tag, attrs) => {
      const el= document.createElementNS('http://www.w3.org/2000/svg', tag);
      if (tag === 'svg') {
        el.setAttribute('xmlns', "http://www.w3.org/2000/svg");
        el.setAttribute('version', "1.1");
      }

      for (let k in attrs) {
        el.setAttribute(k, attrs[k]);
      }
      return el;
    },

    makeEllipse: (x,y,width,height) => {
    },

    makeRectangle: (x,y,width,height) => {
    },

    makeArrow: (x1,y1,x2,y2) => {
      // Cf : https://www.beyondjava.net/how-to-connect-html-elements-with-an-arrow-using-svg
      const arrowHeadDef = 
        '<defs>' +
        '  <marker id="arrowHead" viewBox="0 0 10 10" refX="0" refY="5" markerUnits="strokeWidth" markerWidth="10" markerHeight="8" orient="auto">' +
        '    <path d="M 0 0 L 10 5 L 0 10 z"></path>' +
        '  </marker>' +
        '</defs>';
    },

    makeCheckmark: (x, y, height) => {
      const checkMark = svg.makeSvgElement('path', 
                                           {
                                             d: 'M 0 ' + height * 0.6 + ' ' + height * 0.35 + ' ' + height + ' ' + height * 0.7 + ' 0',
                                             fill:'none',
                                             'stroke-width':'8',
                                             'stroke':'green',
                                             'width': '25'
                                           }
      );
      return checkMark;
    },

    makeLeftBracket: (x, y, width,height) => {
    },

    makeRightBracket: (x, y, width,height) => {
    },
    
    // need to use html injection, not code generation to make stuff work, 
    // cf my post: https://stackoverflow.com/questions/52675823/preserveaspectratio-ignored-by-code-generation-but-not-html-injection-for-svg-p

    makeRightCurlyBracket: (x, y, height) => {
      const container = svg.makeSvgElement('svg', {
        'xmlns': "http://www.w3.org/2000/svg",
        'version': "1.1",
        'class':"graffitiSvg",
        'width':"8",
        'height': height,
        'viewbox':"0 0 200 692",
//        'preserveAspectRatio':"meet"
      });
      const rightCurlyBracket = 
        svg.makeSvgElement('path',
                           { 
                             fill: "none",
                             stroke: "#000",
                             "vector-effect": "non-scaling-stroke",
                             "stroke-width" : "2",
                             d: "M0,0 A100, 173.20508075688772 0 0 1  100, 173.20508075688772 A100, " + 
                                "173.20508075688772 0 0 0 200 346.41016151377545 A100, " + 
                                "173.20508075688772 0 0 0 100, 519.6152422706632 A100, " +
                                "173.20508075688772 0 0 1 0, 692.8203230275509"
                           }
        );
      container.appendChild(rightCurlyBracket);
      return container;
    }
  };
  
  return (svg);
});


/*
#foo {
  width:600px;
  height:300px;
  background-color: teal;
  position: relative;
}

svg {
  width:10px;
  height:50px;
  position:absolute;
  left:150px;
  top:30px;
}

<html>
<head>
<title>Curly Bracket SVG </title>
</head>
<body>
<div id="foo">
<svg xmlns = "http://www.w3.org/2000/svg" version = "1.1" viewbox="0 0 200 692" preserveAspectRatio="none" >

<title>Closing Curly Brace</title>
<path fill = "none" stroke= " #000000" stroke-width="2" vector-effect="non-scaling-stroke" d = "M0,0 A100, 173.20508075688772 0 0 1  100, 173.20508075688772 A100, 173.20508075688772 0 0 0 200 346.41016151377545 A100, 173.20508075688772 0 0 0 100, 519.6152422706632 A100, 173.20508075688772 0 0 1 0, 692.8203230275509"></path>

</svg></div>
<!-- square root of 3 = "1.7320508075688772"-->
</body>
</html>
*/