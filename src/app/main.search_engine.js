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
import {ElementIndex, initFull} from "./main.indexes.js";

async function search(query) {
    await initFull();
    return indexesManager.getAllIndexedFiles()
        .reduce((results, indexedFile) => {
            const result = matchPage(indexedFile, query);
            if (result) {
                results.push(
                    {
                        file: indexedFile,
                        result: result,
                    }
                );
            }
            const resultIndex = matchIndex(indexedFile, query);
            if (resultIndex) {
                results.push(
                    {
                        file: indexedFile,
                        result: resultIndex,
                    }
                );
            }
            return results;
        }, [])
        .sort((a, b) => b.accuracy - a.accuracy)
        .slice(0, 8)
        .map((result) => {
            return {
                file: result.file,
                isCode: result.result instanceof indexesManager.FileIndex,
                element: applyHighlight(result.result.element.mainElement, result.result.offset, result.result.sentence.length),
            }
        });
}

function applyHighlight(htmlElement, offset, length) {
    let currentOffset = 0;
    let newElement = htmlElement.cloneNode();
    for (let child of htmlElement.childNodes) {
        const newChild = child.cloneNode(true);
        newElement.appendChild(newChild);
        const childLength = newChild.textContent.length;
        const offsetBox = offset - currentOffset;
        const consumeLength = Math.min(offsetBox + length, childLength);
        if (offset >= currentOffset && offset < currentOffset + childLength) {
            const consumeSpace = consumeLength - offsetBox;
            if (child.childNodes.length > 0) {
                newElement.replaceChild(applyHighlight(child, 0, consumeLength), newChild);
            } else {
                const range = document.createRange();
                range.setStart(newChild, offsetBox);
                range.setEnd(newChild, consumeLength);
                // Style the highlighted text
                range.surroundContents(document.createElement('mark'));
            }
            offset += consumeSpace;
            length -= consumeSpace;
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
        .sort((a, b) => b.accuracy - a.accuracy);
    if (results.length > 0) {
        return results[0];
    }
    return null;
}

function approxMatch(query, text) {
    //text = text.trim();
    const foundMatches = [...text.matchAll(/[\w-_]+/g)]
        .map((word, index) => {
            return {
                text: word[0],
                offset: word.index,
                position: index,
            };
        })
        .map((word) => {
            return query.split(/\s+/).map((searchWord) => {
                return {
                    sentence: word.text,
                    accuracy: LevenshteinAccuracy(word.text.toLowerCase(), searchWord.toLowerCase()),
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
        })
    }
    return null;
}

function LevenshteinAccuracy(a, b) {
    return 1 - LevenshteinDistance(a, b) / Math.max(a.length, b.length);
}

function LevenshteinDistance(a, b) {
    const lenA = a.length;
    const lenB = b.length;
    if (lenA === 0) {
        return lenB
    }
    if (lenB === 0) {
        return lenA
    }
    const matrix = [];
    for (let i = 0; i <= lenA; i++) {
        matrix[i] = [i]
    }
    for (let j = 0; j <= lenB; j++) {
        matrix[0][j] = j
    }
    for (let i = 1; i <= lenA; i++) {
        for (let j = 1; j <= lenB; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            )
        }
    }
    return matrix[lenA][lenB]
}

export {
    search
}