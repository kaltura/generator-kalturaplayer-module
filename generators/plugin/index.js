'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var path = require("path");

var pluginDependenciesMap = {
    'base': 'mw.KBasePlugin',
    'button': 'mw.KBaseButton',
    'component': 'mw.KBaseComponent',
    'list': 'mw.KBaseMediaList',
    'screen': 'mw.KBaseScreen',
    'ad': 'mw.BaseAdPlugin'
};
var requireUiFeatures = function(plugin){
  return (plugin.pluginBase !== 'base' && plugin.pluginBase !== 'ad');
};
var validateModPlugName = function(name){    
    if (name.match(/^[a-zA-Z][a-zA-Z0-9]+$/)) {        
        return true;
    } else {
        return "Name must start with letter, and not contain spaces or non-alphanumeric characters";        
    }
};

module.exports = yeoman.generators.Base.extend({
    initializing: function () {
        debugger;
        this.argument('name', {
            required: true,
            type: String,
            desc: 'The plugin name'
        });

        this.argument('moduleName', {
            required: false,
            type: String,
            desc: 'The module name'
        });

        this.moduleName = this.moduleName || process.cwd().split(path.sep).pop();
    },

    prompting: function() {
        var done = this.async();

        // Have Yeoman greet the user.
        this.log(yosay(
            'Welcome to the supreme ' + chalk.cyan('KalturaPlayer plugin generator!') + '\n\r' +
            'Create\n\r' + 
            chalk.red(this.name) + ' ' +
            chalk.green('plugin') + ' ' + 
            chalk.yellow('in') + ' ' + 
            chalk.blue(this.moduleName) + ' ' + 
            chalk.magenta('module')
        ));
        
        var prompts = [{
            type: 'input',
            name: 'kalturaPluginName',
            message: 'Enter your plugin name',
            validate: validateModPlugName,
            default: this.name
        }, {
            type: 'list',
            name: 'pluginBase',
            message: 'Enter your plugin type',
            choices: ['base', 'button', 'component', 'list', 'screen', 'ad']
        }, {
            type: 'confirm',
            name: 'requireMessageFile',
            message: 'Do you need i18n support?',
            default: false,
            when: requireUiFeatures
        }, {
            type: 'confirm',
            name: 'requireTemplate',
            message: 'Do you need template?',
            default: false,
            when: requireUiFeatures
        }, {
            type: 'input',
            name: 'templates',
            message: 'Do you know your templates names?(Can be more then one, comma seperated list)',
            when: function(answers) {
                return answers.requireTemplate;
            },
            validate: function(answers) {
                if (answers.match(/[^a-zA-Z,]+/)) {
                    return "Only comma seperated list of characters a-zA-Z are allowed";
                } else {
                    return true;
                }
            },
            filter: function(answers) {
                var res = {};
                if (answers.length){
                    var templateNames = answers.split(",");
                    templateNames.forEach(function(name){
                        res[name] = "";
                    });
                } 
                return res;
            }
        }];        

        this.prompt(prompts, function(props) {
            this.props = props;            
            // Unmark this to see prompt results
            // this.log(JSON.stringify(props, null, '\t'));  
            done();
        }.bind(this));
    },

    configuring: {
        resolvePlugin: function() {        
            this.paths = {
                root: (this.moduleName === process.cwd().split(path.sep).pop()) ? './' : this.moduleName + '/',
                resources: 'resources/',
                tests: 'tests/'
            };

            this.props.dependencies = [pluginDependenciesMap[this.props.pluginBase]];
            this.props.scripts = [this.paths.resources + this.props.kalturaPluginName + '.js'];
            if (requireUiFeatures(this.props)){
                this.props.styles = [this.paths.resources + this.props.kalturaPluginName + '.css'];
            }
            if (this.props.requireMessageFile) {
                this.props.messageFile = this.paths.resources + this.props.kalturaPluginName + ".i18n.json";                    
            }
            if (this.props.requireTemplate) {
                Object.keys(this.props.templates).forEach(function(name, index, arr) {
                    this.props.templates[name] =  this.paths.resources + name + '.tmpl.html';                        
                }.bind(this));
            }
            //Plugin settings clean up
            delete this.props.pluginBase;
            delete this.props.requireMessageFile;
            delete this.props.requireTemplate;
                        
            // Unmark this to see resolved results
            // this.log(JSON.stringify(this.props, null, '\t'));
        }
    },

    writing: {
        app: function() {
            //First verify that module is valid for plugin
            var moduleExist = true;
            var paths = this.paths;
            var manifestsPath = paths.root + this.moduleName + '.manifest.json';     
            this.log(manifestsPath);       
            var moduleRegistryPath = paths.root + this.moduleName + '.json';
            if (!this.fs.exists(manifestsPath)){
                this.log(chalk.red("Couldn't find module manifest, aborting..."));
                moduleExist = false;
            }
            if (!this.fs.exists(moduleRegistryPath)){
                this.log(chalk.red("Couldn't find module registry, aborting..."));
                moduleExist = false;
            }

            if (moduleExist){
                //Update plugin in module manifest            
                //Fetch manifest template
                var manifestT = this.fs.read(this.templatePath('_manifest.json'));
                //Fetch manifests 
                var manifests = this.fs.readJSON(manifestsPath, {});                                
                //Create manifest from template
                var manifest = JSON.parse(this.engine(manifestT));
                //Merge the plugin manifest to the registry manifest
                manifests[this.props.kalturaPluginName] = manifest; 
                //Write back to the module manifest               
                this.fs.write(manifestsPath, JSON.stringify(manifests, null, '\t'));
                
                //Update plugin in module registry            
                //Fetch module registry
                var registry = this.fs.readJSON(moduleRegistryPath);
                //Add plugin to module registry
                registry[this.props.kalturaPluginName] = this.props;
                //Write back to the module registry    
                this.fs.write(moduleRegistryPath, JSON.stringify(registry, null, '\t'));
                
                //Create plugin file
                this.fs.copyTpl(
                    this.templatePath('_plugin.js'),
                    this.destinationPath(paths.root + this.props.scripts[0]),
                    { 
                        plugin: this.props,                         
                        hasUI: this.props.styles ? true : false                        
                    }
                );            

                //Create plugin CSS file if needed            
                if (this.props.styles){
                    this.fs.copyTpl(
                        this.templatePath('_style.css'),
                        this.destinationPath(paths.root + this.props.styles[0]),
                        this.props
                    );
                }

                //Create plugin i18n file if needed
                if (this.props.messageFile) {
                    this.fs.copyTpl(
                        this.templatePath('_i18n.json'),
                        this.destinationPath(paths.root + this.props.messageFile),
                        {name: this.props.kalturaPluginName}
                    );
                }
                
                //Create plugin template file/s if needed
                if (this.props.templates) {
                    Object.keys(this.props.templates).forEach(function(template) {
                        this.fs.write(paths.root + this.props.templates[template], '');
                    }.bind(this));
                }
            }
        }
    },
});
