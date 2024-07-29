/*
 * Copyright (c) 2020-2024.
 *
 *  The code in this file is part of the PyTgCalls project.
 *  Please refer to official links:
 *  * Repo: https://github.com/pytgcalls
 *  * News: https://t.me/pytgcallsnews
 *  * Chat: https://t.me/pytgcallschat
 *  * Documentation: https://pytgcalls.github.io
 *
 *  We consider these above sources to be the only official
 *  sources for news related to this source code.
 *  With <3 by @kuogi (and the fox!)
 */
import * as indexesManager from "./main.indexes.js";
import {initFull} from "./main.indexes.js";
import {handleRecursive} from "./main.parser.js";

const MAX_RESULTS = 10;
export let isSearching = false;

const UNSUPPORTED_HIGHLIGHT_ELEMENTS = [
    'SYNTAX-HIGHLIGHT', 'SHI', 'MULTISYNTAX'
];

export async function search(query) {
    isSearching = true;
    await initFull();
    const results = indexesManager.getAllIndexedFiles()
        .reduce((results, indexedFile) => {
            const result = matchPage(indexedFile, query);
            if (result) {
                results.push(
                    {
                        file: indexedFile,
                        data: result,
                    }
                );
            }
            const resultIndex = matchIndex(indexedFile, query);
            if (resultIndex) {
                results.push(
                    {
                        file: indexedFile,
                        data: resultIndex,
                    }
                );
            }
            return results;
        }, [])
        .sort((a, b) => b.data.accuracy - a.data.accuracy)
        .reduce((results, result) => {
            if (result.data.element instanceof indexesManager.FileIndex) {
                if (results.filter((r) => r.data.element instanceof indexesManager.FileIndex).length < MAX_RESULTS) {
                    results.push(result);
                }
            } else {
                if (results.filter((r) => r.data.element instanceof indexesManager.ElementIndex).length < MAX_RESULTS) {
                    results.push(result);
                }
            }
            return results;
        }, [])
        .map((result) => {
            if (result.data.element instanceof indexesManager.FileIndex) {
                return {
                    file: result.file,
                    element: result.data.element,
                };
            } else {
                try {
                    return {
                        file: result.file,
                        element: indexesManager.ElementIndex.cloneFrom(
                            applyHighlight(result.data.element.mainElement, result.data.offset, result.data.sentence.length),
                            result.data.element,
                        ),
                    };
                } catch (ignored) {
                    return null;
                }
            }
        })
        .filter((result) => result);
    isSearching = false;
    return results;
}

function applyHighlight(htmlElement, offset, length) {
    let currentOffset = 0;
    const newElement = htmlElement.cloneNode();
    for (let child of htmlElement.childNodes) {
        const newChild = child.cloneNode(true);
        const childLength = newChild.textContent.length;
        const offsetBox = offset - currentOffset;
        const consumeLength = Math.min(offsetBox + length, childLength);
        if (offset >= currentOffset && offset < currentOffset + childLength) {
            const consumeSpace = consumeLength - offsetBox;
            if (!UNSUPPORTED_HIGHLIGHT_ELEMENTS.includes(child.nodeName.toUpperCase())) {
                if (child.childNodes.length > 0) {
                    newElement.appendChild(applyHighlight(child, offsetBox, consumeSpace));
                } else {
                    newElement.appendChild(newChild);
                    const range = document.createRange();
                    range.setStart(newChild, offsetBox);
                    range.setEnd(newChild, consumeLength);
                    // Style the highlighted text
                    range.surroundContents(document.createElement('mark'));
                }
            } else {
                throw new Error('Unsupported highlight element');
            }
            offset += consumeSpace;
            length -= consumeSpace;
        } else {
            newElement.appendChild(newChild);
        }
        currentOffset += childLength;
    }
    return newElement;
}

function matchIndex(file, query) {
    const results = indexesManager.getIndexedValue(file)
        .filter((indexedValue) => indexedValue instanceof indexesManager.FileIndex)
        .map((indexedValue) => {
            let match = approxMatch(query, indexedValue.name);
            if (match !== null) {
                return {
                    accuracy: match.accuracy,
                    element: indexedValue
                };
            }
        })
        .filter((match) => match)
        .sort((a, b) => b.accuracy - a.accuracy);
    if (results.length > 0) {
        return results[0];
    }
    return null;
}

function matchPage(file, query) {
    const results = indexesManager.getIndexedValue(file)
        .filter((indexedValue) => indexedValue instanceof indexesManager.ElementIndex)
        .map((indexedValue) => {
            let match = approxMatch(query, indexedValue.mainElement.textContent);
            if (match !== null) {
                return {
                    accuracy: match.accuracy,
                    offset: match.offset,
                    sentence: match.sentence,
                    element: indexedValue
                };
            }
        })
        .filter((match) => match)
        .sort((a, b) => b.accuracy - a.accuracy);
    if (results.length > 0) {
        return results[0];
    }
    return null;
}

function approxMatch(query, text) {
    const foundMatches = [...text.matchAll(/[\w-_()><]+/g)]
        .map((word, index) => {
            return {
                text: word[0],
                offset: word.index,
                position: index,
            };
        })
        .map((word) => {
            return [...query.matchAll(/[\w-_()><]+/g)].map((searchWord) => {
                return {
                    sentence: word.text,
                    accuracy: LevenshteinAccuracy(word.text.toLowerCase(), searchWord[0].toLowerCase()),
                    position: word.position,
                    offset: word.offset,
                };
            }).reduce((best, current) => {
                return current.accuracy > best.accuracy ? current : best;
            });
        })
        .filter((match) => match.accuracy >= 0.5)
        .reduce((finalMatches, match) => {
            if (finalMatches.length > 0 && finalMatches[finalMatches.length - 1].position + 1 === match.position) {
                const offset_prev = finalMatches[finalMatches.length - 1].offset + finalMatches[finalMatches.length - 1].sentence.length;
                const middleChars = text.substring(offset_prev, match.offset);
                const prevAccuracy = LevenshteinAccuracy(finalMatches[finalMatches.length - 1].sentence.toLowerCase(), query.toLowerCase());
                const newText = finalMatches[finalMatches.length - 1].sentence + middleChars + match.sentence;
                const newAccuracy = LevenshteinAccuracy(newText.toLowerCase(), query.toLowerCase());
                if (newAccuracy >= prevAccuracy) {
                    finalMatches[finalMatches.length - 1].sentence = newText;
                    finalMatches[finalMatches.length - 1].position = match.position;
                    finalMatches[finalMatches.length - 1].accuracy = newAccuracy;
                } else {
                    finalMatches.push(match);
                }
            } else {
                finalMatches.push(match);
            }
            return finalMatches;
        }, [])
        .filter((match) => match.accuracy >= 0.5 && match.sentence.length / query.length >= 0.5);
    if (foundMatches.length > 0) {
        return foundMatches.reduce((best, current) => {
            return current.accuracy >= best.accuracy ? current : best;
        });
    }
    return null;
}

function LevenshteinAccuracy(a, b) {
    return 1 - LevenshteinDistance(a, b) / Math.max(a.length, b.length);
}

function LevenshteinDistance(s, t) {
    if (s === t) {
        return 0;
    }
    const n = s.length, m = t.length;
    if (n === 0 || m === 0) {
        return n + m;
    }
    let x = 0, y, a, b, c, d, g, h;
    const p = new Uint16Array(n);
    const u = new Uint32Array(n);
    for (y = 0; y < n;) {
        u[y] = s.charCodeAt(y);
        p[y] = ++y;
    }

    for (; (x + 3) < m; x += 4) {
        const e1 = t.charCodeAt(x);
        const e2 = t.charCodeAt(x + 1);
        const e3 = t.charCodeAt(x + 2);
        const e4 = t.charCodeAt(x + 3);
        c = x;
        b = x + 1;
        d = x + 2;
        g = x + 3;
        h = x + 4;
        for (y = 0; y < n; y++) {
            a = p[y];
            if (a < c || b < c) {
                c = (a > b ? b + 1 : a + 1);
            }
            else {
                if (e1 !== u[y]) {
                    c++;
                }
            }

            if (c < b || d < b) {
                b = (c > d ? d + 1 : c + 1);
            }
            else {
                if (e2 !== u[y]) {
                    b++;
                }
            }

            if (b < d || g < d) {
                d = (b > g ? g + 1 : b + 1);
            }
            else {
                if (e3 !== u[y]) {
                    d++;
                }
            }

            if (d < g || h < g) {
                g = (d > h ? h + 1 : d + 1);
            }
            else {
                if (e4 !== u[y]) {
                    g++;
                }
            }
            p[y] = h = g;
            g = d;
            d = b;
            b = c;
            c = a;
        }
    }

    for (; x < m;) {
        const e = t.charCodeAt(x);
        c = x;
        d = ++x;
        for (y = 0; y < n; y++) {
            a = p[y];
            if (a < c || d < c) {
                d = (a > d ? d + 1 : a + 1);
            }
            else {
                if (e !== u[y]) {
                    d = c + 1;
                }
                else {
                    d = c;
                }
            }
            p[y] = d;
            c = a;
        }
        h = d;
    }

    return h;
}

export function generateResultPreview(docsRefPreview, chunks) {
    const docsRefPage = document.createElement('div');
    docsRefPage.classList.add('page');
    docsRefPreview.appendChild(docsRefPage);

    const fakeDom = document.createElement('div');
    fakeDom.append(...chunks);
    handleRecursive(fakeDom, docsRefPage);

    const firstIdsElement = docsRefPage.querySelector('.ids');
    if (firstIdsElement != null) {
        const selectedCoords = firstIdsElement.getBoundingClientRect();
        const tempPreviewCoords = docsRefPreview.getBoundingClientRect();

        const containerHeight = docsRefPreview.clientHeight;
        const y = selectedCoords.top - tempPreviewCoords.top;
        const yCenter = (y - containerHeight / 2 + selectedCoords.height / 2);

        docsRefPage.style.setProperty('--try', '-'+yCenter+'px');
    }
}