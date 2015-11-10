const fs = require('fs');
const endOfLine = require('os').EOL;

function write(outputPath, nodeToChildNodes, nodeImageFileName) {
    var url, nodeName;
    var nodeNames = {};
    var nodeIdCounter = 0;

    var stream = fs.createWriteStream(outputPath, {
        flags: 'w',
        defaultEncoding: 'utf8'
    });

    stream.write("digraph G {");
    stream.write(endOfLine);
    stream.write("\tnode [shape=box];");
    stream.write(endOfLine);

    for (url in nodeToChildNodes) {
        nodeName = "url_" + (++nodeIdCounter);
        nodeNames[url] = nodeName;

        stream.write("\t");
        stream.write(nodeName);

        var imageFileName = nodeImageFileName[url];
        if (imageFileName) {
            stream.write(" [label=\"\" image=\"");
            stream.write(imageFileName);
        }
        else {
            stream.write(" [label=\"");
            stream.write(url);
        }

        stream.write("\"];");
        stream.write(endOfLine);
    }

    stream.write(endOfLine);

    for (url in nodeToChildNodes) {
        nodeName = nodeNames[url];
        var childNodes = nodeToChildNodes[url];
        for (var i = 0; i < childNodes.length; i++) {
            var childNode = childNodes[i];
            var childNodeName = nodeNames[childNode];
            stream.write("\t");
            stream.write(nodeName);
            stream.write(" -> ");
            stream.write(childNodeName);
            stream.write(";");
            stream.write(endOfLine);
        }
    }

    stream.write("}");
    stream.end(endOfLine);
}

module.exports.write = write;