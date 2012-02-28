Parser plugin for jQuery
========================

This plugin parses `DOM` on document load; according to the HTML5
microdata spec.

Demo
----

[Examples](https://github.com/pozs/jQuery-parse/tree/master/example "Examples")

Example Usage
-------------

```html
<div id="sample" itemscope itemtype="urn:jquery:parser:pluginName">
  <meta itemprop="simple" data-parser-type="boolean" content="true" />
  <div itemprop="complex" itemscope>
    <meta itemprop="primary" content="1" />
    <meta itemprop="secondary" content="2" />
  </div>
  <meta itemprop="array" content="1" />
  <meta itemprop="array" content="2" />
  <meta itemprop="array" content="3" />
  <script type="text/x-javascript-method" itemprop="method">
    $( this ).addClass( "method-invoked" );
  </script>
</div>
```

is equivalent with:

```js
$( function () {
  $( "#sample" ).pluginName( {
    simple: true,
    complex: {
      primary: 1,
      secondary: 2
    },
    array: [1, 2, 3],
    method: function ( event, ui ) {
      $( this ).addClass( "method-invoked" );
    }
  } );
} );
```

Features
--------

*   implicit parameter-types: string/array (depends on the occurence count)
*   explicit parameter types achieved with the `data-parser-type` attribute  
    (additional parameters through the `data-parser-params` attribute);  
    conversion from string to:
    *   `undefined`
    *   `null`
    *   `JSON`, `json` (jQuery.parseJSON used)
    *   `Boolean`, `boolean`, `bool` (`1`, `t`, `y`, `true`, `yes`, `on` counts as
        `true`, everithing else is false)
    *   `Number`, `number` (NaN, +/- Infinity supported)
    *   `integer`, `int` (through `parseInt()`; params used as radix if supplied)
    *   `float`, `double`, `real` (through `parseFloat()`)
    *   `Array`, `array` (through `String.prototype.split()`; params used in split if supplied)
    *   `RegExp`, `regexp` (params used as modifiers in the constructor if supplied)
    *   `Function`, `function` (params used as argument list if supplied; default: `event, ui`)
    *   `Date`, `date`, `datetime`
*   explitit parameter types achieved with semantical tags:
    *   `time[datetime]` converts to `Date`
    *   `script[type="text/x-javascript-method"]` converts to `Function`  
        you cound use `<script type="text/x-javascript-method; params=a,b,c">`
        for explicit argument-list
