# Explorerism
Shamefully winning the first browser war again, by lousily emulating functional collections, XMLDOM, XMLHTTP, XML data island and data binding.

## Usage
```html
<script src="explorerism.js" data-globalize-named-elements="oNamedElement, txtTextBox"></script>
```


## Background
I had to work with a system that only supported Internet Explorer (not only that, but using the old quirks mode, which is the Internet Explorer 5.5 document mode). Since I prefer modern browsers (and modern pages and web technologies, but that is a loss cause when the system is not mine), I took the liberty of modernizing the system (or ancienting the browser ;)) by adding as much support as necessary, for modern browsers in a backwards way - emulating old features (using a browser extension to inject my code, for example), instead of modernizing the code (which is out of my control).

## Features
This is an **incomplete**, almost _quick and dirty_ implementation of -
- Functional collections (specifically, `window.frames(...)`, `document.frames(...)` and `Element.prototype.childNodes(...)`).
- Globally named elements* (like, `window.txtTextBox` for `<input name="txtTextBox">`).
- XML data islands.
- Data binding (using XML data islands).
- ActiveXObject of Microsoft.XMLHTTP and Microsoft.XMLDOM (lousily merged).

*Note that this is done manually, using the `data-globalize-named-elements` attribute on the `<script>`.

## Browser support
I have only tested Chrome, but it should work in any **modern** browser, as it uses standard web technologies (please, do file an issue if you find anything nonstandard).
