const wikiQueries = require("../db/queries.wikis.js");
const Authorizer = require("../policies/application");
const markdown = require( "markdown" ).markdown;
const Collaborator = require("../db/models").Collaborator;

module.exports = {
    index(req, res, next){

        wikiQueries.getAllWikis((err, wikis) => {
            if(err){
                res.redirect(500, "static/index");
            } else {
                res.render("wikis/index", {wikis});
            }
        })
    },

    privateIndex(req, res, next) {
        wikiQueries.getAllWikis((err, wikis) => {
            if(err) {
                res.redirect(500, "static/index");
            } else {
                res.render("wikis/private", {wikis})
            }
        })
    },

    new(req, res, next){

        const authorized = new Authorizer(req.user).new();

        if(authorized) {
            res.render("wikis/new");
        } else {
            req.flash("notice", "You are not authorized to do that.");
            res.redirect("/wikis");
        }
    },

    create(req, res, next){

        const authorized = new Authorizer(req.user).create();

        if(authorized) {

            let newWiki = {
                title: markdown.toHTML(req.body.title),
                body: markdown.toHTML(req.body.body),
                private: req.body.private,
                userId: req.user.id
            };

            wikiQueries.addWiki(newWiki, (err, wiki) => {
                if(err){
                    console.dir(err);
                    res.redirect(500, "/wikis/new");
                } else {
                    res.redirect(303, `${wiki.id}`);
                }
            });
        } else {
            req.flash("notice", "You are not authorized to do that.");
            res.redirect("/wikis");
        }
    },

    show(req, res, next){

        wikiQueries.getWiki(req.params.id, (err, wiki) => {
            if(err || wiki == null){
                res.redirect(404, "/wikis");
            } else {
                res.render("wikis/show", {wiki , markdown});
            }
        });
    },

    destroy(req, res, next){
        wikiQueries.deleteWiki(req, (err, wiki) => {
            if(err){
                res.redirect(500, `/wikis/${req.params.id}`)
            } else {

                const authorized = new Authorizer(req.user, wiki).destroy();

                if(authorized){
                    res.redirect(303, "/wikis");
                } else {
                    req.flash("You are not authorized to do that.")
                    res.redirect(`/wikis/${req.params.id}`)
                }
            }
        });
    },

    edit(req, res, next){
        wikiQueries.getWiki(req.params.id, (err, wiki) => {
            if(err || wiki == null){
                res.redirect(404, "/");
            } else {

                const authorized = new Authorizer(req.user, wiki).edit();

                if(authorized) {
                    res.render("wikis/edit", {wiki});
                } else {
                    req.flash("You are not authorized to do that.")
                    res.redirect(`/wikis/${req.params.id}`)
                }
            }
        });
    },

    update(req, res, next){

        wikiQueries.updateWiki(req, req.body, (err, wiki) => {
            if(err || wiki == null){
                res.redirect(404, `/wikis/${req.params.id}/edit`);
            } else {
                res.redirect(`/wikis/${req.params.id}`);
            }
        });
    }
}