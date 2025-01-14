import { LiteEvent } from "../event_engine/LiteEvent";
import * as ICON from "./icons";
import { Board } from "../shelf/entities/board";
import { Shelf } from "../shelf/shelf";
import { ProductEntity } from "../entity_engine/product_entity";
import { Strut } from "../shelf/entities/strut";

require('./navigation_2d.css');

export class Navigation2D {
    private grid: HTMLElement;
    private shelf: Shelf;
    private selectedBoard: Board;
    private selectedStrut: Strut;

    private boardBottomBar: HTMLElement;
    private strutBottomBar: HTMLElement;
    private sideBar: HTMLElement;

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
    
    constructor(grid: HTMLElement, shelf: Shelf) {
        this.grid = grid;
        this.shelf = shelf;

        this.createSideBar();
        this.createBoardBottomBar();
        this.createStrutBottomBar();

        this.shelf.BoardRemoved.on((board) => {
            this.setSelectedProduct(null);
        });
    }

    setSelectedProduct(product: ProductEntity) {        
        if (!product) {
            // hide the bottom bar
            this.boardBottomBar.classList.remove("visible");
            this.boardBottomBar.classList.add("hidden");

            this.strutBottomBar.classList.remove("visible");
            this.strutBottomBar.classList.add("hidden");
        } else if (product instanceof Board) {
            this.selectedBoard = product;
            this.selectedStrut = null;

            this.strutBottomBar.classList.remove("visible");
            this.strutBottomBar.classList.add("hidden");

            this.boardBottomBar.classList.add("visible");
            this.boardBottomBar.classList.remove("hidden");
            return;
        } else if (product instanceof Strut) {
            this.selectedStrut = product;
            this.selectedBoard = null;

            this.boardBottomBar.classList.remove("visible");
            this.boardBottomBar.classList.add("hidden");

            this.strutBottomBar.classList.add("visible");
            this.strutBottomBar.classList.remove("hidden");
        }
    }

    private createStrutBottomBar() {
        // Create the 2D overlay div
        this.strutBottomBar = document.createElement("div");
        this.strutBottomBar.id = "bottomBar";
        this.strutBottomBar.classList.add("hidden");
        this.grid.appendChild(this.strutBottomBar);

        // Add some buttons to the overlay
        const buttonDelete = document.createElement("button");
        buttonDelete.innerHTML = ICON.trashbin;
        buttonDelete.className = "button button-primary button-rounded";
        buttonDelete.addEventListener('click', () => {
            const numStruts = this.shelf.getStruts().length;

            if (this.selectedStrut.getIndex() < numStruts / 2) {
                this.shelf.removeStrutAtStart();
            } else {
                this.shelf.removeStrutAtEnd();
            }
            
            this.setSelectedProduct(null);
        });
        this.strutBottomBar.appendChild(buttonDelete);

        const addButton = document.createElement("button");
        addButton.innerHTML = ICON.plus;
        addButton.className = "button button-primary button-rounded";
        addButton.addEventListener('click', () => {
            const numStruts = this.shelf.getStruts().length;

            if (this.selectedStrut.getIndex() < numStruts / 2) {
                this.shelf.addStrutToStart();
            } else {
                this.shelf.addStrutToEnd();
            }

            this.setSelectedProduct(null);
        });
        this.strutBottomBar.appendChild(addButton);
    }

    private createBoardBottomBar() {
        // Create the 2D overlay div
        this.boardBottomBar = document.createElement("div");
        this.boardBottomBar.id = "bottomBar";
        this.boardBottomBar.classList.add("hidden");
        this.grid.appendChild(this.boardBottomBar);

        // Add some buttons to the overlay
        const buttonDelete = document.createElement("button");
        buttonDelete.innerHTML = ICON.trashbin;
        buttonDelete.className = "button button-primary button-rounded";
        buttonDelete.addEventListener('click', () => {
            if (!this.selectedBoard) {
                return;
            }
            
            this.shelf.removeBoard(this.selectedBoard);
            this.setSelectedProduct(null);
        });
        this.boardBottomBar.appendChild(buttonDelete);

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
        this.boardBottomBar.appendChild(buttonDuplicate);

        /*
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
        this.boardBottomBar.appendChild(buttonPin);
        */

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
        this.boardBottomBar.appendChild(buttonShorten);

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
        this.boardBottomBar.appendChild(buttonWiden);
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