'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');

var validateModPlugName = function(name){    
    if (name.match(/^[a-zA-Z][a-zA-Z0-9]+$/)) {        
        return true;
    } else {
        return "Name must start with letter, and not contain spaces or non-alphanumeric characters";        
    }
};

module.exports = yeoman.generators.Base.extend({
    initializing: function() {
        this.pkg = require('../package.json');
    },

    prompting: function() {
        var done = this.async();

        // Have Yeoman greet the user.
        this.log(yosay(
            'Welcome to the supreme ' + chalk.cyan('KalturaPlayer module generator!')
        ));

        var prompts = [{
            type: 'input',
            name: 'moduleName',
            message: 'Enter your module name',
            validate: validateModPlugName
        }];

        var pluginPrompts = [{
            type: 'input',
            name: 'kalturaPluginName',
            message: 'Enter your plugin name',
            validate: validateModPlugName
        }, {
            type: 'confirm',
            name: 'morePlugin',
            message: 'Do you want to add more plugins?',
            default: false
        }];

        var pluginSeq = function() {
            this.prompt(pluginPrompts, function(props) {
                this.props.plugins.push(props.kalturaPluginName);                
                if (props.morePlugin) {
                    pluginSeq();
                } else {
                    // Unmark this to see prompt results
                    // console.log(JSON.stringify(this.props, null, '\t'));
                    done();
                }
            }.bind(this));
        }.bind(this);

        this.prompt(prompts, function(props) {
            this.props = props; 
            this.props.plugins = [];           
            pluginSeq();
        }.bind(this));

    },
    
    writing: {
        app: function() {
            this.fs.write(this.props.moduleName + "/" + this.props.moduleName + '.json', "{}");
            this.fs.write(this.props.moduleName + "/" + this.props.moduleName + '.manifest.json', "{}");

            this.props.plugins.forEach(function(plugin){
                this.composeWith("kalturaplayer-module:plugin", {args: [plugin, this.props.moduleName]});
            }.bind(this));
        }
    },

    install: function() {
        // this.installDependencies();
    }
});
