/*!
 * @fileOverview (in-load) parser plugin for jQuery
 * @author pozs <david.pozsar@gmail.com>
 * @license http://opensource.org/licenses/gpl-3.0.html GNU General Public License
 */

;( function ( $, global, undefined ) {

var autoload = [],
    helper   = function ( $parent ) {
        var props = {};
        
        $parent.find( "[itemprop]" ).
            not( $parent.find( "[itemscope] [itemprop]" ) ).
            each( function () {
                var $prop = $( this ),
                    names = $prop.attr( "itemprop" ).split( /\s+/ ),
                    value = extract( $prop ),
                    i, l  = names.length,
                    name;
                
                for ( i = 0; i < l; ++i ) {
                    name = names[i];
                    
                    if ( ! ( name in props ) ) {
                        props[name] = [];
                    }
                    
                    props[name].push( value );
                }
            } );
        
        return props;
    },
    extract  = function ( $prop ) {
        var parsed  = false,
            value   = "",
            type    = $prop.attr( "data-parser-type" ),
            params  = $prop.attr( "data-parser-params" );
        
        switch ( true ) {
            case typeof $prop.attr( "itemscope" ) != "undefined":
                value = getProps( $prop );
                break;
            
            case $prop.is( "meta" ):
                value = $prop.attr( "content" ) || "";
                break;
            
            case $prop.is( "audio, embed, iframe, img, source, track, video" ):
                value = $prop.attr( "src" ) || "";
                break;
            
         /* case $prop.is( "input, keygen, select, textarea" ):
                value = $prop.val() || "";
                break; */
            
            case $prop.is( "datalist" ):
                parsed = true;
                value = $( "option", $prop ).map( function () {
                    var $this = $( this );
                    return $this.attr( "value" ) || $this.text();
                } ).get();
                break;
            
            case $prop.is( "a, area, link" ):
                value = $prop.attr( "href" ) || "";
                break;
            
            case $prop.is( "object" ):
                value = $prop.attr( "data" ) || "";
                break;
            
            case $prop.is( "data, option" ):
                value = $prop.attr( "value" ) || $prop.text();
                break;
            
            case $prop.is( "time" ):
                value = $prop.attr( "datetime" ) || $prop.text();
                break;
            
            default:
                value = $prop.text();
                break;
        }
        
        if ( ! parsed ) {
            switch ( true ) {
                case "undefined" == type:
                    value = undefined;
                    break;
                
                case "null" == type:
                    value = null;
                    break;
                
                case /^(JSON|json)$/.test( type ):
                    value = $.parseJSON( value );
                    break;
                
                case /^(Boolean|boolean|bool)$/.test( type ):
                    value = /^(1|t|y|true|yes|on)$/.test( value );
                    break;
                
                case /^(Number|number)$/.test( type ):
                    value = Number( value );
                    break;
                
                case /^(integer|int)$/.test( type ):
                    value = params ? parseInt( value, Math.max( Math.
                        min( params || 10, 2 ) ), 36 ) : parseInt( value );
                    break;
                
                case /^(float|double|real)$/.test( type ):
                    value = parseFloat( value );
                    break;
                
                case /^(Array|array)$/.test( type ):
                    value = params ? value.split( params ) : [ value ];
                    break;
                
                case /^(RegExp|regexp)$/.test( type ):
                    value = new RegExp( value, params );
                    break;
                
                case /^(Function|function)$/.test( type ):
                    value = new Function( params || "event, ui", value );
                    break;
                
                case /^(Date|date|datetime)$/.test( type ):
                case $prop.is( "time[datetime]" ):
                    value = new Date( value );
                    break;
                
                case $prop.is( "script[type=text/javascript-method]" ):
                case $prop.is( "script[type=text/x-javascript-method]" ):
                    value = new Function( "event, ui", value );
                    break;
                
                case $prop.is( "script[type^=text/javascript-method;]" ):
                case $prop.is( "script[type^=text/x-javascript-method;]" ):
                    value = new Function(
                        $prop.attr( "type" ).
                            replace( /^.*;\s*/, "" ).
                            replace( /^charset=[^;];?/, "" ).
                            replace( /^params=/, "" ).
                            replace( /;?\s*$/, "" ),
                        value
                    );
                    break;
                
                case $.isFunction( global[type] ):
                    value = new global[type]( value );
                    break;
            }
        }
        
        return value;
    },
    getProps = function ( $item ) {
        var props = helper( $item ),
            refs  = ( $item.attr( "itemref" ) || "" ).split( /\s+/ ),
            i, l  = refs.length;
        
        for ( i = 0; i < l; ++i ) {
            if ( refs[i] ) {
                props = $.extend( props, helper( $( "#" + refs[i] ) ) );
            }
        }
        
        for ( i in props ) {
            if ( props[i].length == 1 ) {
                props[i] = props[i][0];
            }
        }
        
        return props;
    },
    PARSER_TYPE     = 'urn:jquery:parser';
    EVENTS_TYPE     = 'urn:jquery:parser:events';
    PARSER_SELECTOR = '[itemscope][itemtype^="' + PARSER_TYPE +
                         ':"]:not([itemtype="' + EVENTS_TYPE + '"])',
    EVENTS_SELECTOR = '[itemscope][itemtype="' + EVENTS_TYPE + '"]';

$.extend( {
    /**
     * @function
     * @name parser
     * @scope jQuery
     * @param {String|Node|NodeList|jQuery.fn} node where the parser parse
     * @type {jQuery}
     * @return the jQuery object
     */
    "parser": $.extend( function jQuery_parser ( node ) {
        var $node   = $( node ),
            $items  = $node.find( PARSER_SELECTOR ),
            $events = $node.find( EVENTS_SELECTOR );
        
        $items.each( function () {
            var prom,
                $item   = $( this ),
                type    = $item.attr( "itemtype" ).
                            replace( new RegExp( "^" + PARSER_TYPE + ":" ), "" ).
                            replace( ":", "." ),
                done    = false,
                then    = function () {
                    if ( ! done && $.isFunction( $item[type] ) ) {
                        done = true;
                        $item[type]( getProps( $item ) );
                        return true;
                    }
                    
                    return false;
                };
            
            if ( ! $.isFunction( $item[type] ) ) {
                prom = $.parser.autoload( type, then );
                if ( prom ) {
                    if ( $.isFunction( prom.promise ) ) {
                        prom.promise().then( then );
                    }
                }
                else
                {
                    return;
                }
            }
            
            then();
        } );
        
        $events.each( function () {
            var $event      = $( this ),
                selector    = $event.attr( "itemid" ),
                props       = getProps( $event );
            
            if ( selector ) {
                $node.on( props, selector );
            } else {
                $event.parent().on( props );
            }
        } );
        
        return $;
    }, {
        "displayName": "jQuery.parser",
        /**
         * @function
         * @scope jQuery.parser
         * @param {String} plugin the missing plugin by name
         * <br />(return deferred when the load can complete async)
         * @param {Function} then used when the load can complete async
         * <br />(do not return deferred, if then is used)
         * @type {Boolean}
         * @return whether to load was successful
         */
        "autoload": $.extend( function jQuery_parser_autoload ( plugin, then ) {
            var i, l = autoload.length,
                result;
            
            for ( i = 0; i < l; ++i ) {
                result = autoload[i]( plugin, then );
                if ( result ) {
                    return result;
                }
            }
            
            return false;
        }, {
            "displayName": "jQuery.parser.autoload",
            /**
             * @function
             * @name autoload
             * @scope jQuery.parser.autoload
             * @param {Function} adapter the additional load-adapter to add the end of the load-chain
             * @type {Function}
             * @return jQuery.parser.autoload for fluent interface
             */
            "push": $.extend( function jQuery_parser_autoload_push ( adapter ) {
                autoload.push( adapter );
                return $.parser.autoload;
            }, {
                "displayName": "jQuery.parser.autoload.push"
            } )
        } )
    } )
} );

$( function () {
    $.parser( "body" );
} );

} )( jQuery, window );
