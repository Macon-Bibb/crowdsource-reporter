﻿/*global define,dojo,dojoConfig,alert */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true,indent:4 */
/*
 | Copyright 2014 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */
//============================================================================================================================//
define([
    "dojo/_base/declare",
    "dojo/dom-construct",
    "dojo/_base/lang",
    "dojo/dom",
    "dojo/dom-attr",
    "dojo/dom-class",
    "dojo/dom-style",
    "esri/request",
    "dojo/on",
    "dojo/query",
    "dojo/text!./templates/app-header.html",
    "widgets/mobile-menu/mobile-menu",
    "widgets/help/help",
    "esri/IdentityManager",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin"
], function (declare, domConstruct, lang, dom, domAttr, domClass, domStyle, esriRequest, on, query, template, MobileMenu, Help, IdentityManager, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        mobileMenu: null,
        config: {
            "help": false,
            "signIn": false,
            "signOut": false
        },
        //fallback string if missing in nls
        i18n: {
            myReport: "My Reports",
            signIn: "Sign in",
            signOut: "Sign out",
            help: "Help",
            signInTooltip: "Sign In",
            signOutTooltip: "Sign Out",
            myReportTooltip: "My Reports",
            helpTooltip: "Help"
        },

        /**
        * Widget is constructed.
        * @param{object} configData to be mixed
        * @memberOf widgets/app-header/app-header
        */
        constructor: function (configData) {
            // check if configData is present, then merge it with config object
            if (configData) {
                lang.mixin(this, configData);
            }
            // check if configurable text is present in nls for app-header widget, then merge it with local nls object
            if (this.appConfig.i18n.appHeader) {
                lang.mixin(this.i18n, this.appConfig.i18n.appHeader);
            }
            if (this.appConfig.i18n.dialog) {
                lang.mixin(this.i18n, this.appConfig.i18n.dialog);
            }
        },

        /**
        * Widget is initialized.
        * @memberOf widgets/app-header/app-header
        */
        postCreate: function () {
            if (this.appConfig.enableHelp) {
                //create help screen
                this.helpScreen = new Help({
                    "config": this.appConfig,
                    "title": this.appConfig.helpDialogTitle,
                    "content": this.appConfig.helpDialogContent,
                    "dialog": "help",
                    "appUtils": this.appUtils
                });

                this.helpScreen.onDialogClosed = lang.hitch(this, function () {
                    this.helpButton.focus();
                });
            }
            if (this.appConfig.enableShare) {
                this._createShareDialogContent();
            }
            //Create modal dialog
            if (this.appConfig.reportingPeriod === "Closed") {
                this.appUtils.createReportingPeriodDialog();
            }
            //set application title
            this._setApplicationTitle();
            //set application logo
            this._setApplicationLogo();

            // if facebook/twitter/googleplus/agol login is enabled in configuration then only
            if (this.appConfig && (this.appConfig.enableFacebook || this.appConfig.enableTwitter || this.appConfig.enableGoogleplus || this.appConfig.enablePortalLogin)) {
                //set header menus based on configuration
                // create mobile menu
                this.mobileMenu = new MobileMenu({ "appUtils": this.appUtils, "config": this.config, "appConfig": this.appConfig }, domConstruct.create("div", {}, dom.byId("mobileMenuContainer")));
                this.mobileMenu.onMyIssuesClicked = lang.hitch(this, function () { this._animateMenuContainer(); this._showMyIssuesClicked(); });
                this.mobileMenu.onSignInClicked = lang.hitch(this, function () { this._animateMenuContainer(); this._signInClicked(); });
                this.mobileMenu.onSignOutClicked = lang.hitch(this, function () { this._animateMenuContainer(); this._signOutClicked(); });
                this.mobileMenu.onHelpClicked = lang.hitch(this, function () { this._animateMenuContainer(); this._helpClicked(); });
                this.mobileMenu.onShareClicked = lang.hitch(this, function () { this._animateMenuContainer(); this._shareClicked(); });

                //If user is signed-in, set focus to my issues menu
                //If user it not signed-in, set focus to sign in menu
                on(this.mobileMenuBurger, "click, keypress", lang.hitch(this, function (evt) {
                    this._animateMenuContainer(evt);
                    setTimeout(lang.hitch(this, function () {
                        if (!domClass.contains(dom.byId('mobileMenuContainer'), "esriCTHideMobileMenu")) {
                            if (this.appConfig.logInDetails.userName !== "") {
                                this.mobileMenu.myReport.focus();
                            } else {
                                this.mobileMenu.signIn.focus();
                            }
                        }
                    }), 500);

                }));
                on(this.myIssueButton, "click, keypress", lang.hitch(this, this._showMyIssuesClicked));
                on(this.signOutButton, "click, keypress", lang.hitch(this, this._signOutClicked));
                this._setAppHeaderMenu();
                // Show the sign in button
                domClass.remove(this.userControlContainer, "esriCTHidden");
                //handle signin/logged_in_userName clicked
                on(this.esriCTLoginCredentialsDiv, "click, keypress", lang.hitch(this, this._toggleLoginOptionsVisibility));
                $(this.esriCTLoginCredentialsDiv).focusin(lang.hitch(this, function (evt) {
                    this._toggleLoginOptionsVisibility(evt, true);
                }));

                $(this.signOutButton).focusout(lang.hitch(this, function (evt) {
                    this._toggleLoginOptionsVisibility(evt, true);
                }));

                //Adding class to hide help icon in mobile view if login is enabled
                domClass.add(this.helpButton, "esriCTMobileHelpIcon");
                domClass.add(this.shareButton, "esriCTMobileHelpIcon");
            } else {
                if (domClass.contains(this.mobileMenuBurger, "esriCTMobileIcons")) {
                    domClass.replace(this.mobileMenuBurger, "esriCTHidden", "esriCTMobileIcons");
                }
            }
            if (this.appConfig.enableHelp) {
                domClass.remove(this.helpButton, "esriCTHidden");
                domStyle.set(this.esriCTLoginOptionsDiv, "right", "50px");
            } else {
                domStyle.set(this.esriCTLoginOptionsDiv, "right", "6px");
            }

            if (this.appConfig.enableShare) {
                domClass.remove(this.shareButton, "esriCTHidden");
            }

            on(this.helpButton, "click, keypress", lang.hitch(this, this._helpClicked));
            on(this.shareButton, "click, keypress", lang.hitch(this, this._shareClicked));
            domAttr.set(this.helpButton, "title", this.appConfig.helpLinkText);
            domAttr.set(this.helpButton, "aria-label", this.appConfig.helpLinkText);
            //Load help screen on load based on configuration settings
            setTimeout(lang.hitch(this, function () {
                if (this.appConfig.showHelpOnLoad && this.appConfig.enableHelp) {
                    this._helpClicked();
                }
            }), 500);
            //Resize the header controller on window resize
            on(window, "resize", lang.hitch(this, function () {
                setTimeout(lang.hitch(this, function () {
                    this._resizeHeaderController();
                }), 100);
            }));
        },

        /**
        * This function is used to create share dialog content
        * @memberOf widgets/app-header/app-header
        */
        _createShareDialogContent: function () {
            var shareContent, buttonsContainer;
            formContent = domConstruct.create("form", {});
            domConstruct.create("div", {
                "innerHTML": this.i18n.shareDialogAppURLLabel,
                "for": "urlTextArea",
                "class": "control-label",
                "style": "font-weight: bold"
            }, formContent);

            //Create text area for showing the application url
            this.textInput = domConstruct.create("textarea", {
                "rows": "3",
                "id": "urlTextArea",
                "class": "form-control",
                "aria-label": this.i18n.shareDialogAppURLLabel,
                "style": "resize: none"
            }, formContent);
            //Select text in the textarea on click event
            on(this.textInput, "click", lang.hitch(this, function () {
                this.textInput.select();
            }));

            //Create instance of share dialog
            this._shareScreen = new Help({
                "config": this.appConfig,
                "title": this.i18n.shareDialogTitle,
                "content": formContent,
                "dialog": "share",
                "showButtons": true,
                "okButtonText": this.i18n.okButton,
                "cancelButtonText": this.i18n.cancelButton,
                "appUtils": this.appUtils
            });

            //Listen for Ok and Cancel button click events
            this._shareScreen.okButtonClicked = lang.hitch(this, function () {
                this._shareScreen.hideDialog("share");
            });
            this._shareScreen.cancelButtonClicked = lang.hitch(this, function () {
                this._shareScreen.hideDialog("share");
            });
            this._shareScreen.onDialogClosed = lang.hitch(this, function () {
                this.shareButton.focus();
            });
        },

        /**
        * This function is used to set the application title
        * First priority is given to name configured in configuration Panel
        * Second priority is given to group name
        * if both of the above cases failed noGroupNameText configured in nls will be shown as Application title.
        * @memberOf widgets/app-header/app-header
        */
        _setApplicationTitle: function () {
            var applicationName = "";
            if (this.appConfig.applicationName && lang.trim(this.appConfig.applicationName).length !== 0) {
                applicationName = this.appConfig.applicationName;
            } else if (this.appConfig.groupInfo.results.length > 0 && this.appConfig.groupInfo.results[0].title) {
                applicationName = this.appConfig.groupInfo.results[0].title;
            } else {
                applicationName = this.appConfig.i18n.signin.noGroupNameText;
            }
            document.title = applicationName;
            domAttr.set(this.applicationHeaderName, "innerHTML", applicationName);
            domAttr.set(this.applicationHeaderName, "aria-label", applicationName);
            //if application name is empty stretch the app icon container to fit in the app title bar
            if (applicationName === "") {
                domClass.add(this.applicationIconContainer, "esriCTHomeIconStreched");
            }
        },

        /**
        * This function is used to set the application logo
        * @memberOf widgets/app-header/app-header
        */
        _setApplicationLogo: function () {
            var applicationIcon;
            // if application icon is configured, display the configured icon in application header
            // else if group logo is present, display group logo in application header
            // if both the above mentioned icons are not present, display default icon in application header
            if (this.appConfig.applicationIcon && lang.trim(this.appConfig.applicationIcon).length !== 0) {
                if (this.appConfig.applicationIcon.indexOf("http") === 0) {
                    domAttr.set(this.applicationHeaderIcon, "src", this.appConfig.applicationIcon);
                } else {
                    if (this.appConfig.applicationIcon.indexOf("/") === 0) {
                        domAttr.set(this.applicationHeaderIcon, "src", dojoConfig.baseURL + this.appConfig.applicationIcon);
                    } else {
                        domAttr.set(this.applicationHeaderIcon, "src", dojoConfig.baseURL + "/" + this.appConfig.applicationIcon);
                    }
                }
            } else if (this.appConfig.groupInfo.results.length > 0 && this.appConfig.groupInfo.results[0].thumbnailUrl) {
                domAttr.set(this.applicationHeaderIcon, "src", this.appConfig.groupInfo.results[0].thumbnailUrl);
            } else {
                domAttr.set(this.applicationHeaderIcon, "src", dojoConfig.baseURL + "/images/app-icon.png");
            }
            applicationIcon = domAttr.get(this.applicationHeaderIcon, "src");
            //Adjust the header icon once the icon is loaded
            on(this.applicationHeaderIcon, "load", lang.hitch(this, function () {
                this._resizeHeaderController();
            }));
            // On application icon/name click navigate to home screen on mobile devices
            on(this.applicationHeaderIcon, "click", lang.hitch(this, this._navigateToHome));
            on(this.applicationHeaderName, "click, keypress", lang.hitch(this, this._navigateToHome));
        },


        /**
        * Load icons
        * @memberOf widgets/app-header/app-header
        */
        _loadIcons: function (rel, iconPath) {
            var icon;
            icon = domConstruct.create("link");
            icon.rel = rel;
            icon.type = "image/x-icon";
            if (iconPath.indexOf("http") === 0) {
                icon.href = iconPath;
            } else {
                icon.href = dojoConfig.baseURL + iconPath;
            }
            document.getElementsByTagName('head')[0].appendChild(icon);
        },


        /**
        * This function is used to display option available on click of login options arrow.
        * @memberOf widgets/app-header/app-header
        */
        _setAppHeaderMenu: function () {
            if (this.appConfig && this.appConfig.logInDetails && this.appConfig.logInDetails.userName) {
                domAttr.set(this.esriCTLoginUserNameDiv, "innerHTML", this.appConfig.logInDetails.userName);
                domAttr.set(this.esriCTLoginUserNameDiv, "role", "menu");
                domAttr.set(this.esriCTLoginUserNameDiv, "title", "");
                domClass.remove(this.myIssueButton, "esriCTHidden");
                domClass.remove(this.signOutButton, "esriCTHidden");
                domClass.remove(this.caretIcon, "esriCTHidden");
            }
            if (!this.appConfig.enableHelp) {
                domClass.add(this.helpButton, "esriCTHidden");
            }
            if (!this.appConfig.enableShare) {
                domClass.add(this.shareButton, "esriCTHidden");
            }
        },

        /**
        * This function is used to show/hide login option's list also
        * in case of Proceed as guest, signin will be shown instead of username
        * and clicking on it reload the app so that user can sign in using different options from the landing page.
        * @memberOf widgets/app-header/app-header
        */
        _toggleLoginOptionsVisibility: function (evt) {
            if (!this.appUtils.validateEvent(evt, true)) {
                return;
            }
            //if user is not signed in and clicked on sign in text load the application again.
            if (this.config.signIn) {
                this._signInClicked(evt);
            } else {
                domClass.toggle(this.esriCTLoginOptionsDiv, "esriCTHidden");
            }
        },

        /**
        * Navigate the view to home screen.
        * @memberOf widgets/app-header/app-header
        */
        _navigateToHome: function (evt) {
            if (!this.appUtils.validateEvent(evt)) {
                return;
            }
            this.navigateToHome();
        },

        /**
        * This function is used to Sign out of the application
        * @memberOf widgets/app-header/app-header
        */
        _signOutClicked: function (evt) {
            if (!this.appUtils.validateEvent(evt)) {
                return;
            }
            // user is logged in via AGOL portal login
            if (this.config.portalObject) {
                var portalURL = this.config.portalObject.url;
                //If the portal url do not have forward slash
                //at the end, add to make it a valid url once 
                //it is merged with oauth sign out url 
                if (portalURL[portalURL.length - 1] !== "/") {
                    portalURL = portalURL + "/";
                }
                if (this.config.portalObject.getPortalUser()) {
                    esriRequest({
                        url: portalURL + "sharing/oauth2/signout",
                        handleAs: "xml",
                        load: lang.hitch(this, function () {
                            IdentityManager.destroyCredentials();
                            location.reload();
                        })
                    });
                } else {
                    location.reload();
                }
            } else {
                location.reload();
            }
        },

        /**
        * This function is used to load application again on sign in click.
        * @memberOf widgets/app-header/app-header
        */
        _signInClicked: function (evt) {
            if (!this.appUtils.validateEvent(evt)) {
                return;
            }
            window.location.reload();
        },

        /**
        * This function is used to show the configured help text.
        * @memberOf widgets/app-header/app-header
        */
        _helpClicked: function (evt) {
            if (!this.appUtils.validateEvent(evt)) {
                return;
            }
            //show splash screen dialog
            this.helpScreen.showDialog("help");
            return evt;
        },

        /**
         * This function is used add parameters to the URL through which user
         * has navigated like webmap, layer or feature
         * @memberOf widgets/app-header/app-header
         */
        _constructShareURL: function (shareURLParamsObj) {
            var clonedURLObject, url, clonedUrlParameter, urlParameter;
            // Clone the existing url object constructed by boilerplate
            clonedURLObject = lang.clone(this.appConfig.urlObject);
            // In this cloned url object, if share url keys are not available
            // then inject that keys, if it's available just change its old
            // value to new one.
            for (urlParameter in shareURLParamsObj) {
                clonedURLObject.query[urlParameter] = shareURLParamsObj[urlParameter];
            }
            // Fetch the base path, before constructing its parameter.
            // After parameter is constructed, append it to the base path
            url = clonedURLObject.path;
            for (clonedUrlParameter in clonedURLObject.query) {
                if (clonedURLObject.query.hasOwnProperty(clonedUrlParameter)) {
                    // at least 1 parameter is available
                    if (url.indexOf('?') > -1) {
                        url += "&" + clonedUrlParameter + "=" + clonedURLObject.query[clonedUrlParameter];
                    } else { // if no parameters are available
                        url += "?" + clonedUrlParameter + "=" + clonedURLObject.query[clonedUrlParameter];
                    }
                }
            }
            return url;
        },

        /**
        * This function is used to create short url and displayed it in the textarea
        * @memberOf widgets/app-header/app-header
        */
        _shareClicked: function (evt) {
            var url, shareURLParamsObj;
            shareURLParamsObj = this.getSharedUrlParams();
            url = this._constructShareURL(shareURLParamsObj);
            if (!this.appUtils.validateEvent(evt)) {
                return;
            }
            //Call esri's shorten service
            esriRequest({
                url: "https://arcg.is/prod/shorten",
                callbackParamName: "callback",
                content: {
                    longUrl: url,
                    f: "json"
                },
                load: lang.hitch(this, function (response) {
                    if (response && response.data && response.data.url) {
                        this.textInput.value = response.data.url;
                        this._shareScreen.showDialog("share");
                    }
                }),
                error: function (error) {
                    this.textInput.value = url;
                    this._shareScreen.showDialog("share");
                    //Error in creating shorten URL
                    console.log(error);
                }
            });
        },

        /**
        * Update menu list
        * @memberOf widgets/app-header/app-header
        */
        updateMenuList: function (menuList) {
            if (menuList) {
                lang.mixin(this.config, menuList);
            }
            this._setAppHeaderMenu();
            if (this.mobileMenu) {
                this.mobileMenu.updateMenuList(menuList);
            }
        },

        _showMyIssuesClicked: function (evt) {
            if (!this.appUtils.validateEvent(evt)) {
                return;
            }
            this.showMyIssues(evt);
        },

        /**
        * Show or hide mobile menu container
        * @memberOf widgets/app-header/app-header
        */
        _animateMenuContainer: function (evt, canFocus) {
            if (!this.appUtils.validateEvent(evt)) {
                return;
            }
            domClass.toggle(this.mobileMenuBurger, "active");
            domClass.toggle(dom.byId('mobileMenuContainer'), "esriCTHideMobileMenu");
            if (domClass.contains(dom.byId('mobileMenuContainer'), "esriCTHideMobileMenu")) {
                domAttr.set(this.mobileMenuBurger, "aria-expanded", "false");
            } else {
                domAttr.set(this.mobileMenuBurger, "aria-expanded", "true");
            }
        },

        /**
        * Resize header panel based on scree size
        * @memberOf widgets/app-header/app-header
        */
        _resizeHeaderController: function () {
            var appTitleWidth = 5; // Minor padding in mobile mode
            appTitleWidth += this.applicationIconContainer.clientWidth;
            appTitleWidth += query(".esriCTMenuTabRight", this.domNode)[0].clientWidth;
            domStyle.set(this.applicationHeaderName, "width", "calc(100% -  " + appTitleWidth + "px" + ")");
        },
        //Events Generated from App Header
        showMyIssues: function (evt) {
            return evt;
        },

        navigateToHome: function (evt) {
            return evt;
        }
    });
});
