/* eslint-disable quotes */
/* eslint-disable indent */
/* eslint-disable strict */
const express = require('express');
const xss = require('xss');
const BookmarksService = require('./bookmarks-service');

const bookmarksRouter = express.Router();
const jsonParser = express.json();

bookmarksRouter
    .route('/')
    .get((req, res, next) => {
        BookmarksService.getAllBookmarks(
            req.app.get('db')
        )
            .then(bookmarks => {
                res.json(bookmarks);
            })
            .catch(next);
    })
    .post(jsonParser, (req, res, next) => {
        const { title, url, description, rating } = req.body;
        const newBookmark = { title, url, description, rating };

        for (const [key, value] of Object.entries(newBookmark)) {
            if (value == null) {
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body` }
                });
            }
        }

        BookmarksService.insertNewBookmark(
            req.app.get('db'),
            newBookmark
        )
            .then(bookmark => {
                res
                    .status(201)
                    .location(`/bookmarks/${bookmark.id}`)
                    .json(bookmark);
            })
            .catch(next);
    });

bookmarksRouter
    .route('/:bookmark_id')
    .all((req, res, next) => {
        BookmarksService.getById(
            req.app.get('db'),
            req.params.bookmark_id
        )
            .then(bookmark => {
                if (!bookmark) {
                    return res.status(404).json({
                        error: { message: `Bookmark doesn't exist` }
                    })
                }
                res.bookmark = bookmark;// save the article for the next middleware
                next(); // don't forget to call next so the next middleware happens!
            })
            .catch(next);
    })
    .get((req, res, next) => {
        const knexInstance = req.app.get('db');
        BookmarksService.getById(knexInstance, req.params.bookmark_id)
            .then(bookmark => {
                if (!bookmark) {
                    return res.status(404).json({
                        error: { message: `Bookmark doesn't exist` }
                    });
                }
                res.json({
                    id: bookmark.id,
                    url: bookmark.url,
                    title: xss(bookmark.title), // sanitize title
                    description: xss(bookmark.description), // sanitize desc
                    rating: bookmark.rating,
                });
            })
            .catch(next);
    })
    .delete((req, res, next) => {
        BookmarksService.deleteBookmark(
            req.app.get('db'),
            req.params.bookmark_id
        )
            .then(() => {
                res.status(204).end();
            })
            .catch(next);
    });

module.exports = bookmarksRouter;