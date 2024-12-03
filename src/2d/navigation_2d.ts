import { LiteEvent } from "../event_engine/LiteEvent";
import * as ICON from "./icons";
import { Board } from "../shelf/entities/board";
import { Shelf } from "../shelf/shelf";

require('./navigation_2d.css');

export class Navigation2D {
    private grid: HTMLDivElement;
    private shelf: Shelf;
    private selectedBoard: Board;
    private pinnedBoards: Board[] = []; // What if a board is removed?

    private bottomBar: HTMLDivElement;
    private sideBar: HTMLDivElement;

    private readonly onRulerButtonPressed = new LiteEvent<boolean>();
    public get RulerButtonPressed() {
        return this.onRulerButtonPressed.expose();
    }

    private readonly onDecorButtonPressed = new LiteEvent<boolean>();
    public get DecorButtonPressed() {
        return this.onDecorButtonPressed.expose();
    }

    private readonly onDayNightButtonPressed = new LiteEvent<boolean>();
    public get DayNightButtonPressed() {
        return this.onDayNightButtonPressed.expose();
    }

    private readonly onBoardShortened = new LiteEvent<Board>();
    public get BoardShortened() {
        return this.onBoardShortened.expose();
    }

    private readonly onBoardWidened = new LiteEvent<Board>();
    public get BoardWidened() {
        return this.onBoardWidened.expose();
    }
    
    constructor(grid: HTMLDivElement, shelf: Shelf) {
        this.grid = grid;
        this.shelf = shelf;

        this.createSideBar();
        this.createBottomBar();

        this.shelf.BoardRemoved.on((board) => {
            this.setSelectedBoard(null);
        });
    }

    setSelectedBoard(board: Board) {
        this.selectedBoard = board;
        
        if (!board) {
            // hide the bottom bar
            this.bottomBar.classList.remove("visible");
            this.bottomBar.classList.add("hidden");
            return;
        }

        // show the bottom bar
        this.bottomBar.classList.add("visible");
        this.bottomBar.classList.remove("hidden");

        if (this.pinnedBoards.includes(board)) {
            document.getElementById("pinButton").classList.add("active");
        } else {
            document.getElementById("pinButton").classList.remove("active");
        }
    }

    private createBottomBar() {
        // Create the 2D overlay div
        this.bottomBar = document.createElement("div");
        this.bottomBar.id = "bottomBar";
        this.bottomBar.classList.add("hidden");
        this.grid.appendChild(this.bottomBar);

        // Add some buttons to the overlay
        const buttonDelete = document.createElement("button");
        buttonDelete.innerHTML = ICON.trashbin;
        buttonDelete.className = "button button-primary button-rounded";
        buttonDelete.addEventListener('click', () => {
            if (!this.selectedBoard) {
                return;
            }
            
            this.shelf.removeBoard(this.selectedBoard);
            this.setSelectedBoard(null);
        });
        this.bottomBar.appendChild(buttonDelete);

        const buttonDuplicate = document.createElement("button");
        buttonDuplicate.innerHTML = ICON.duplicate;
        buttonDuplicate.className = "button button-primary button-rounded";
        buttonDuplicate.addEventListener('click', () => {
            if (!this.selectedBoard) {
                return;
            }

            const boardAbove = this.shelf.getBoardAbove(this.selectedBoard);
            const boardAboveHeight = boardAbove ? boardAbove.getHeight() : this.shelf.getHeight();
            const newHeight = this.selectedBoard.getHeight() + (boardAboveHeight - this.selectedBoard.getHeight()) / 2;

            // TODO: if no space, try below
            // TODO: if no space at all, do nothing

            this.shelf.addBoard(newHeight, this.selectedBoard.getStartStrut().getIndex(), this.selectedBoard.getEndStrut().getIndex());
        });
        this.bottomBar.appendChild(buttonDuplicate);

        const buttonPin = document.createElement("button");
        buttonPin.innerHTML = ICON.pin;
        buttonPin.className = "button button-primary button-rounded";
        buttonPin.id = "pinButton";
        buttonPin.addEventListener('click', () => {
            if (!this.selectedBoard) {
                return;
            }

            buttonPin.classList.toggle("active");
            if (buttonPin.classList.contains("active")) {
                this.pinnedBoards.push(this.selectedBoard);

                // ensure its removed from the list when the board is removed
                this.shelf.BoardRemoved.on((board) => {
                    const index = this.pinnedBoards.indexOf(board);
                    if (index > -1) {
                        this.pinnedBoards.splice(index, 1);
                    }
                });
            } else {
                const index = this.pinnedBoards.indexOf(this.selectedBoard);
                if (index > -1) {
                    this.pinnedBoards.splice(index, 1);
                }
            }
        });
        this.bottomBar.appendChild(buttonPin);

        const buttonShorten = document.createElement("button");
        buttonShorten.innerHTML = ICON.shorten;
        buttonShorten.className = "button button-primary button-rounded";
        buttonShorten.addEventListener('click', () => {
            if (!this.selectedBoard) {
                return;
            }

            const currentStartIndex = this.selectedBoard.getStartStrut().getIndex();
            const currentEndIndex = this.selectedBoard.getEndStrut().getIndex();

            if (currentEndIndex - currentStartIndex === 1) {
                console.warn("Board is already at minimum length");
                return;
            }

            this.selectedBoard.setSpanStruts(this.shelf.getStruts()[currentStartIndex], this.shelf.getStruts()[currentEndIndex - 1]);
        
            this.onBoardShortened.trigger(this.selectedBoard);
        });
        this.bottomBar.appendChild(buttonShorten);

        const buttonWiden = document.createElement("button");
        buttonWiden.innerHTML = ICON.widen;
        buttonWiden.className = "button button-primary button-rounded";
        buttonWiden.addEventListener('click', () => {
            if (!this.selectedBoard) {
                return;
            }

            const currentStartIndex = this.selectedBoard.getStartStrut().getIndex();
            const currentEndIndex = this.selectedBoard.getEndStrut().getIndex();
            
            // try expanding to the right first, then to the left
            var newStartIndex = currentStartIndex;
            var newEndIndex = Math.min(this.shelf.getStruts().length - 1, currentEndIndex + 1);
            if (newEndIndex === currentEndIndex) {
                newStartIndex = Math.max(0, currentStartIndex - 1);
            }

            if (newStartIndex === currentStartIndex && newEndIndex === currentEndIndex) {
                console.warn("No space to widen board");
                return;
            }

            this.selectedBoard.setSpanStruts(this.shelf.getStruts()[newStartIndex], this.shelf.getStruts()[newEndIndex]);
        
            this.onBoardWidened.trigger(this.selectedBoard);
        });
        this.bottomBar.appendChild(buttonWiden);
    }

    private createSideBar() {
        // Create the 2D overlay div
        this.sideBar = document.createElement("div");
        this.sideBar.id = "sideBar";
        this.sideBar.style.display = "flex";
        this.grid.appendChild(this.sideBar);
        
        const buttonDayNight = document.createElement("button");
        buttonDayNight.innerHTML = ICON.night;
        buttonDayNight.className = "button button-inverted button-rounded";
        buttonDayNight.addEventListener('click', () => {
            buttonDayNight.classList.toggle("active");
            this.onDayNightButtonPressed.trigger(buttonDayNight.classList.contains("active"));
        });
        this.sideBar.appendChild(buttonDayNight);

        const buttonDecor = document.createElement("button");
        buttonDecor.innerHTML = ICON.books;
        buttonDecor.className = "button button-inverted button-rounded";
        buttonDecor.classList.add("active");
        buttonDecor.addEventListener('click', () => {
            buttonDecor.classList.toggle("active");
            this.onDecorButtonPressed.trigger(buttonDecor.classList.contains("active"));
        });
        this.sideBar.appendChild(buttonDecor);

        const buttonRuler = document.createElement("button");
        buttonRuler.innerHTML = ICON.ruler;
        buttonRuler.className = "button button-inverted button-rounded";
        buttonRuler.classList.add("active");
        buttonRuler.addEventListener('click', () => {
            buttonRuler.classList.toggle("active");
            this.onRulerButtonPressed.trigger(buttonRuler.classList.contains("active"));
        });
        this.sideBar.appendChild(buttonRuler);
    }
}