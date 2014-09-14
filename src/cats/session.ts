//
// Copyright (c) JBaron.  All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

module Cats {

  

    export class Session  {

        private errors: Cats.FileRange[] = [];
        outline: NavigateToItem[];
        private outlineTimer: number;
        private diagnosticTimer : number;


        constructor(private editor:Gui.SourceEditor) {
            
        }


        setErrors(errors: Cats.FileRange[]) {
            if ((this.errors.length === 0) && (errors.length === 0)) return;
            this.errors = errors;
            this.editor.emit("errors", this.errors);
        }


        private setOutline(outline: NavigateToItem[]) {
            this.outline = outline;
            this.editor.emit("outline", this.outline);
        }


        updateContent(content: string) {
            this.editor.project.iSense.updateScript(this.editor.filePath, this.editor.getContent());
            this.updateDiagnostics();
        }

        /**
         * Lets check the worker if something changed in the diagnostic.
         * 
         */
        updateDiagnostics(timeout=1000) {
            clearTimeout(this.diagnosticTimer);
            var project = this.editor.project;
            this.diagnosticTimer = setTimeout(() => {
            
                    project.iSense.getErrors(this.editor.filePath, (err: Error, result: Cats.FileRange[]) => {
                        if (project.config.codingStandards.useLint) {
                            result = result.concat(project.linter.lint(this.editor.filePath, this.editor.getContent()));
                        }
                        this.setErrors(result);
                    });
                
            }, timeout);    
        }


        private convertPos(item: any): Cats.Range {
            return {
                start: {
                    row: item.startPosition.line,
                    column: item.startPosition.character
                },
                end: {
                    row: item.endPosition.line,
                    column: item.endPosition.position.character
                }
            };
        }

        /**
         * Lets check the worker if something changed in the outline of the source.
         * But lets not call this too often.
         */
        private updateOutline(timeout= 5000) {
                // Clear any pending updates
                clearTimeout(this.outlineTimer);
                this.outlineTimer = setTimeout(() => {
                    this.editor.project.iSense.getScriptLexicalStructure(this.editor.filePath, (err: Error, data: NavigateToItem[]) => {
                        this.setOutline(data);
                    });
                }, timeout);
           
        }


    }
    
}