(function ()
 {
  // Shared functions
  function getByXPath(xpath, root)
  {
   function get(xpath)
   {
    return document.evaluate(xpath, root, null, XPathResult.ANY_TYPE, null);
   }
   var nodes;

   if (xpath.includes("[0]"))
   {
    xpath = xpath.replace(/\[0\]/g, "[1]");
   }

   nodes = get(xpath);
   
   if (nodes.iterateNext())
   {
    return get(xpath);
   }
   return get(xpath.toLowerCase());
  }
  
  function selectNodesByXPath(xpath, root)
  {
      var nodes = getByXPath(xpath, root),
         currentNode,
         nodeList = [];
     while (currentNode = nodes.iterateNext())
     {
      nodeList.push(currentNode);
     }
     nodeList.item = function (i) { return this[i]; };
     return nodeList;
  }
  
  // Emulating non functional collections.
  (function ()
   {
    function defineFunctionalFrames(object)
    {
     Object.defineProperty(
      object,
      "frames",
      {
       get:
        function ()
        {
         var o, property;
         function getFrameByName(name)
         {
          return window[name];
         }
         // TODO - This is probably an overkill.
         // Enumeration of window[0 to X where X is undefined] is probably enough.
         for (o in window)
         {
          if (o === "frames")
          {
           continue;
          }

          property = window[o];
          if (window.hasOwnProperty(o) && property && property instanceof Window)
          {
           getFrameByName[o] = window[o];
          }
         }
         return getFrameByName;
        }
      });
    }
    
    function defineFunctionalChildNodes()
    {
     // Emulating support for childNodes(i) along with childNodes[i],
     // excluding white space only text nodes.
     // TODO - make it an almost live collection by using setInterval,
     // MutationObserver or deprecated DOM manipulation events.
     var originalChildNodeGetter =
          Object.getOwnPropertyDescriptor(
           Node.prototype, "childNodes").get;

     Object.defineProperty(
      Node.prototype,
      "childNodes",
      {
       get:
        function ()
        {
         var childNodes = originalChildNodeGetter.call(this),
             finalChildNodes = [],
             length = childNodes.length,
             finalLength,
             i;
         
         function newGetter(i)
         {
          return finalChildNodes[i];
         }

         for (i = 0; i < length; i++)
         {
          if (childNodes[i].nodeType !== 3 || childNodes[i].textContent.trim())
          {
           finalChildNodes.push(childNodes[i]);
          }
         }

         finalLength = finalChildNodes.length;
         for (i = 0; i < finalLength; i++)
         {
          newGetter[i] = finalChildNodes[i];
         }

         Object.defineProperty(newGetter, "length", {value: finalLength});
         return newGetter;
        }
      });
    }


    try
    {
     document.frames("a");
    }
    catch (ignore)
    {
     defineFunctionalFrames(document);
    }
    
    try
    {
     window.frames("a");
    }
    catch (ignore)
    {
     defineFunctionalFrames(window);
    }
    
    try
    {
     document.documentElement.childNodes(0);
    }
    catch (ignore)
    {
     defineFunctionalChildNodes();
    }
   }());
   
  // Emulating named elements globalization for specific elements.
  (function ()
   {
    var randomName = "______________rnd_______" + ((new Date()).getTime() * 3) + "____dnr",
        eTest = document.createElement("meta");

    eTest.name = randomName;

    function cleanUp()
    {
     document.head.removeChild(eTest);
     eTest = null;
    }

    eTest = document.head.insertBefore(eTest, document.head.firstChild);

    if (window[randomName] === eTest)
    {
     cleanUp();
     return;
    }
    
    cleanUp();

    (document.currentScript.getAttribute("data-globalize-named-elements") || "")
     .split(",").forEach(
      function (elementName)
      {
       if (!elementName)
       {
        return;
       }

       Object.defineProperty(
        window, elementName,
        {get: function ()
        {
         var element = [];
         function find(root)
         {
          Array.prototype.forEach.call(root.querySelectorAll(
          "[id=\"" + elementName + "\"], [name=\"" + elementName + "\"]"),
          function (currentElement)
          {
           if (currentElement.name === elementName || currentElement.id === elementName)
           {
            element.push(currentElement);
           }
          });
         }

         find(document);
         return element.length > 1? element : element[0];
        }});
      });
   }());

   // Lousily emulating MSXML related ActiveXObject instances -
   // - Microsoft.XMLDOM.
   // - Microsoft.XMLHTTP.
   // Note - all of the objects are merged into one, there is not distinction,
   // so if two objects share the same method name but the functionality is
   // in fact different, it will not be different here.
   // Emulating ActiveXObject more realistically requires much more work
   // and lots of getters and setters (for XMLHttpRequest), basically.
  (function ()
   {
    try
    {
     window.ActiveXObject("Microsoft.XMLDOM");
     return;
    }
    catch (ignore)
    {
    }
    
    window.ActiveXObject = window.XMLHttpRequest;
    ActiveXObject.prototype.parseError = {};
    ActiveXObject.prototype.loadXML =
     function (xmlString)
     {
      this.load("data:text/xml," + xmlString);
     };
    ActiveXObject.prototype.load =
     function (url)
     {
      var that = this;
      this.open("get", url, false);

      if (!("errorCode" in this.parseError))
      {
       Object.defineProperty(
        this.parseError,
        "errorCode",
        {
         get:
          function ()
          {
             if (that.responseText && that.responseText.indexOf("<") === 0 && (that.processAndGetXmlDocument()))
             {
              return 0;
             }
             return 1;
          }
        });
      }

      this.send(null);
     };
   
    ActiveXObject.prototype.processAndGetXmlDocument =
     function ()
     {
      return this.responseXml || (this.xml && this.responseXml);
     };

    ActiveXObject.prototype.selectSingleNode =
     function (xpath)
     {
      return getByXPath(xpath, this.processAndGetXmlDocument()).iterateNext();
     };
     
    ActiveXObject.prototype.createAttribute =
     function (name)
     {
      return this.processAndGetXmlDocument().createAttribute(name);
     };

    ActiveXObject.prototype.selectNodes =
     function (xpath)
     {
      return selectNodesByXPath(xpath, this.processAndGetXmlDocument());
     };

    Object.defineProperty(
     ActiveXObject.prototype,
     "firstChild",
     {
      get: function ()
      {
       return this.processAndGetXmlDocument().firstChild;
      }
     });

    Object.defineProperty(
     ActiveXObject.prototype,
     "xml",
     {
      get:
       function ()
       {
        var parser = new DOMParser();
        this.responseXml = parser.parseFromString(this.responseText, "text/xml");
        return this.responseText || "";
       }
     });

    // The ActiveX version of XMLHttpRequest supports upper case first letter function names.
    if (!XMLHttpRequest.prototype.Open)
    {
     XMLHttpRequest.prototype.Open = XMLHttpRequest.prototype.open;
    }
    if (!XMLHttpRequest.prototype.Send)
    {
     XMLHttpRequest.prototype.Send = XMLHttpRequest.prototype.send;
    }
   }());

  // Emulating XML data islands and data binding.
  if (!("dataSrc" in document.createElement("span")))
  {
   (function () {
    
    // Hiding the content of <xml> elements.
    function appendDefaultStyleSheet()
    {
     var style = document.createElement("style");
     style.innerHTML = "xml{display:none}";
     document.head.appendChild(style);
    }
    appendDefaultStyleSheet();

    function populateBoundElements(root, dataSource)
    {
     var elementsToPopulate = Array.prototype.slice.call(root.querySelectorAll("[datafld]"));
     if (root.getAttribute("datafld"))
     {
      elementsToPopulate.push(root);
     }
     elementsToPopulate.forEach(
      function (column)
      {
       var boundName = column.getAttribute("datafld"),
           dataElementContainingNode,
           boundNode,
           value;
       
       boundNode = dataSource.querySelector(boundName + ", " + boundName.toUpperCase());
       if (boundNode)
       {
        value = boundNode.textContent;
       }
       else
       {
        dataElementContainingNode = dataSource.querySelector("[" + boundName + "], [" + boundName.toUpperCase() + "]");
        if (dataElementContainingNode)
        {
         boundNode =
          dataElementContainingNode.attributes.getNamedItem(name) ||
          dataElementContainingNode.attributes.getNamedItem(name.toUpperCase());
        }
        else
        {
         return;
        }
       }
       column.boundXmlIslandNode = boundNode;
       if ("value" in column)
       {
        column.value = value;
        column.onchange =
         function ()
         {
          // Using textContent here in order to avoid updating the
          // bound page element (since the page element updated it).
          column.boundXmlIslandNode.textContent = column.value;
         };
       }
       else
       {
        column.textContent = value;
       }
      });
    }

    function bindAndPopulateTableElements(element, dataDocument)
    {
     var originalRow = element.removeChild(element.children[0]),
         root = dataDocument.documentElement,
         dataRows;
     
     if (root.children.length > 1 && root.children[0].tagName === root.children[1].tagName)
     {
      dataRows = root.children;
     }
     else
     {
      dataRows = [root];
     }

     if (element.originalRow)
     {
      element.innerHTML = "";
     }
     else
     {
      element.originalRow = originalRow;
     }
     
     Array.prototype.forEach.call(
      dataRows,
      function (dataRow)
      {
       var row = originalRow.cloneNode(true);
       populateBoundElements(row, dataRow);
       element.appendChild(row);
      });
    }

    function processBoundElement(element, xmlDocument)
    {
     if (!xmlDocument.document)
     {
      return false;
     }
     if (element.tagName === "TABLE")
     {
       bindAndPopulateTableElements(element.tBodies[0], xmlDocument.document);
     }
     else
     {
      populateBoundElements(element, xmlDocument.document);
     }
     
     return true;
    }

    /** @constructor */
    function XMLDataIsland(owner)
    {
     this.owner = owner;
     if (owner.tagName === "XML" && owner.innerHTML.trim())
     {
      this.loadXML(owner.innerHTML);
     }
     this.boundDestinations = [];
    }

    XMLDataIsland.prototype.parseError = {};

    XMLDataIsland.prototype.loadXML =
     function (xmlString)
     {
      var that = this,
          parser = new DOMParser(),
          observer = new MutationObserver(function ()
          {
           observer.disconnect();
           observer = null;
           this.document.observeChanges();
          });

      this.document = parser.parseFromString(xmlString, "text/xml");
      this.document.observeChanges =
       function ()
       {
        observer.disconnect();
        reflectChanges();
       };
      
      observer.observe(this.document, {
       childList: true,
       attributes: true,
       characterData: true,
       subtree: true
      });

      if (!("errorCode" in this.parseError))
      {
       Object.defineProperty(
        this.parseError,
        "errorCode",
        {
         get:
          function ()
          {
             if (xmlString && xmlString.indexOf("<") === 0 && that.document)
             {
              return 0;
             }
             return 1;
          }
        });
      }
      
      function processAndChangeReadyState(element)
      {
       var shouldChangeReadyState = true;
       if (that.owner !== element)
       {
        shouldChangeReadyState = processBoundElement(element, that);
       }

       if (!shouldChangeReadyState)
       {
        return;
       }

       element.readyState = "complete";
       setTimeout(function ()
       {
        eval(element.getAttribute("onreadystatechange"));
        if (element.onreadystatechange)
        {
         element.onreadystatechange();
        }
       },
       20);
      }
      
      function reflectChanges()
      {
       that.readyState = "complete";
       if (that.onreadystatechange)
       {
        that.onreadystatechange();
       }
       
       processAndChangeReadyState(that.owner);
       that.boundDestinations.forEach(processAndChangeReadyState);
      }
      
      reflectChanges();
     };

    XMLDataIsland.prototype.load =
     function (url)
     {
      var request = new ActiveXObject();
      request.load(url);
      this.loadXML(request.responseText);
     };

    XMLDataIsland.prototype.selectNodes =
     function (xpath)
     {
      return selectNodesByXPath(xpath, this.document);
     };
    XMLDataIsland.prototype.selectSingleNode =
     function (xpath)
     {
      return getByXPath(xpath, this.document).iterateNext();
     };

    XMLDataIsland.prototype.cloneNode =
     function (withSubtree)
     {
      return this.document.cloneNode(withSubtree);
     };

    Element.prototype.readyState = "complete";

    Element.prototype.selectSingleNode =
     function (xpath)
     {
      return getByXPath(xpath, this).iterateNext();
     };
     
    Element.prototype.loadXML = 
     function (xmlString)
     {
      this.XMLDocument.loadXML(xmlString);
     };

    Element.prototype.selectNodes =
     function (xpath)
     {
      return this.XMLDocument.document ? this.XMLDocument.selectNodes(xpath) : selectNodesByXPath(xpath, this);
     };

    Object.defineProperty(
     Element.prototype,
     "XMLDocument",
     {
      get:
       function ()
       {
        return this.xmlDocument || (this.xmlDocument = new XMLDataIsland(this));
       }
     });

    Object.defineProperty(
     Element.prototype,
     "text",
     {
      get:
       function ()
       {
        return this.textContent;
       },
      set:
       function (value)
       {
        this.textContent = value;
        if (this.ownerDocument.observeChanges)
        {
         this.ownerDocument.observeChanges();
        }
       }
     });

    Object.defineProperty(
     Element.prototype,
     "xml",
     {
      get:
       function ()
       {
        if (this.ownerDocument.contentType.includes("xml"))
        {
         return this.outerHTML;
        }
        return this.innerHTML;
       }
     });
     
    // Emulating automatic element to XML binding and source XML loading.
    window.addEventListener("load",
     function ()
     {
      setTimeout(
      function ()
      {
       Array.prototype.forEach.call(document.querySelectorAll("[datasrc],xml[src]"),
        function (e)
        {
         if ((e.getAttribute("datasrc") || "").indexOf("#") === 0)
         {
          e.xmlDocument = document.querySelector(e.getAttribute("datasrc")).XMLDocument;
         }
         else
         {
          e.XMLDocument.load(e.getAttribute("datasrc") || e.getAttribute("src"));
         }
       
         e.XMLDocument.boundDestinations.push(e);
         
         if (processBoundElement(e, e.XMLDocument))
         {
          e.readyState = "complete";
          if (e.getAttribute("onreadystatechange"))
          {
           setTimeout(
            function ()
            {
             eval(e.getAttribute("onreadystatechange"));
            },
            10);
          }
         }
        });
      },
      2000);
     });
   }());
  }
 }());
