(function ( mw, $ ) {
	"use strict";
	mw.PluginManager.add( '<%= plugin.kalturaPluginName %>', <%= plugin.dependencies[0]%>.extend( {
		setup: function(){
			//Plugin setup, all actions which needs to be done on plugin loaded and before playerReady event
			this.addBindings();
		},
		isSafeEnviornment: function(){

		},
		addBindings:function(){

		},
		<% if ( hasUI ){ %>
		addKeyboardShortcuts: function(){

		}
		<% } %>
	} ) );
} ) ( window.mw, window.jQuery );	