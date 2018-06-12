/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 The Regents of the University of California
 * Author: Jim Robinson
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * Created by dat on 5/8/18.
 */
var app = (function (app) {
    app.GenomeModalController = function (browser, config) {

        let self = this,
            urlLoaderConfig,
            locaFileLoaderConfig,
            $dismiss,
            $ok;

        this.browser = browser;

        // shared by file and url modals

        locaFileLoaderConfig =
            {
                hidden: false,
                embed: true,
                $widgetParent: config.$fileModal.find('.modal-body'),
                mode: 'localFile'
            };

        this.localFileLoader = browser.createFileLoadWidget(locaFileLoaderConfig, new igv.FileLoadManager());

        // upper dismiss - x - button
        $dismiss = config.$fileModal.find('.modal-header button:nth-child(1)');
        $dismiss.on('click', function () {
            self.localFileLoader.dismiss();
        });

        // lower dismiss - close - button
        $dismiss = config.$fileModal.find('.modal-footer button:nth-child(1)');
        $dismiss.on('click', function () {
            self.localFileLoader.dismiss();
        });

        // ok - button
        $ok = config.$fileModal.find('.modal-footer button:nth-child(2)');
        $ok.on('click', function () {
            self.okHandler(self.localFileLoader.fileLoadManager);
            self.localFileLoader.dismiss();
            config.$fileModal.modal('hide');
        });

        urlLoaderConfig =
            {
                hidden: false,
                embed: true,
                $widgetParent: config.$urlModal.find('.modal-body'),
                mode: 'url'
            };

        this.urlLoader = browser.createFileLoadWidget(urlLoaderConfig, new igv.FileLoadManager());

        // upper dismiss - x - button
        $dismiss = config.$urlModal.find('.modal-header button:nth-child(1)');
        $dismiss.on('click', function () {
            self.urlLoader.dismiss();
        });

        // lower dismiss - close - button
        $dismiss = config.$urlModal.find('.modal-footer button:nth-child(1)');
        $dismiss.on('click', function () {
            self.urlLoader.dismiss();
        });

        // ok - button
        $ok = config.$urlModal.find('.modal-footer button:nth-child(2)');
        $ok.on('click', function () {
            self.okHandler(self.urlLoader.fileLoadManager);
            self.urlLoader.dismiss();
            config.$urlModal.modal('hide');
        });


        // Dropbox
        this.dropboxController = new app.DropboxController(browser, config.$dropboxModal);
        this.dropboxController.configure(function () {

            // do stuff
            self.okHandler(self.dropboxController.loader.fileLoadManager);
            self.dropboxController.loader.dismiss();
            self.dropboxController.$modal.modal('hide');

        });


    };

    app.GenomeModalController.prototype.okHandler = function (fileLoadManager) {

        var self = this;

        this
            .getGenomeObject(fileLoadManager)
            .then(function (dictionary) {
                var genome;

                if (dictionary) {

                    genome = Object.values(dictionary).pop();
                    return self.browser.loadGenome(genome);

                } else {
                    return Promise.reject(new Error('Error: no genome data file.'));
                }

            })
            .then(function (genome) {

                if (genome.id) {
                    app.trackLoadController.createEncodeTable(genome.id);
                } else {
                    app.trackLoadController.encodeTable.hidePresentationButton();
                }

            })
            .catch(function (error) {
                igv.presentAlert(error);
            });

    };

    app.GenomeModalController.prototype.getGenomeObject = function (fileLoadManager) {
        let obj;

        if (undefined === fileLoadManager.dictionary.data) {
            return Promise.reject(new Error('Error: No data file'));
        } else if (false === isValidDataFileOrURL.call(this, fileLoadManager.dictionary.data)) {
            return Promise.reject(new Error('Error: data file is invalid.'));
        } else {

            if (true === isValidIndexFileORURL.call(this, fileLoadManager.dictionary.data)) {
                return Promise.reject(new Error('Error: index file submitted as data file.'));
            } else {

                if (fileLoadManager.dictionary.index && false === isValidIndexFileORURL.call(this, fileLoadManager.dictionary.index)) {
                    return Promise.reject(new Error('Error: index file is not valid.'));
                }

                if ('json' === igv.getExtension({ url: fileLoadManager.dictionary.data })) {
                    return app.genomeController.getGenomes(fileLoadManager.dictionary.data)
                } else {
                    obj = {};
                    obj[ 'noname' ] = { fastaURL: fileLoadManager.dictionary.data, indexURL: (fileLoadManager.dictionary.index || undefined) };
                    return Promise.resolve(obj);
                }

            }

        }

    };

    function isValidDataFileOrURL (fileOrURL) {
        var extension,
            success;

        extension = igv.getExtension({ url: fileOrURL });
        success = ('fasta' === extension || 'fa' === extension || 'json');
        return success;

    }

    function isValidIndexFileORURL(fileOrURL) {
        var extension,
            success;

        extension = igv.getExtension({ url: fileOrURL });
        success = ('fai' === extension);
        return success;
    }

    return app;
})(app || {});
