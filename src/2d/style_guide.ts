require('./style_guide.css');
import * as ICON from "./icons";

export class StyleGuide {
    private main: HTMLDivElement;

    constructor() {
        this.main = document.createElement('div');
        this.main.id = 'style-guide-main';
        this.main.style.display = 'none';
        document.body.appendChild(this.main);

        const pageTitle = document.createElement('h1');
        pageTitle.textContent = 'Style Guide';
        this.main.appendChild(pageTitle);

        this.createSection('Typography');
        const textContainer = document.createElement('div');
        textContainer.id = 'style-guide-text-container';
        this.main.appendChild(textContainer);
        this.createHeaders(textContainer);
        this.createTextStyles(textContainer);
        
        this.createSection('Colors');
        this.createColors();
        
        this.createSection('Buttons');
        this.createButtons();
        
        this.createSection('Scrollbars');
        this.createScrollbars();

        // toggle visibility
        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.key === 'S') {
                if (this.main.style.display === 'none') {
                    this.main.style.display = 'flex';
                } else {
                    this.main.style.display = 'none';
                }
            }
        });
    }

    private createSection(title: string) {
        const header = document.createElement('h2');
        header.id = 'style-guide-section';
        header.textContent = title;
        this.main.appendChild(header);
    }

    private createHeaders(parent: HTMLElement) {
        const createHeader = (level: number) => {
            const header = document.createElement(`h${level}`);
            header.textContent = `Header ${level}`;
            return header;
        };

        const container = document.createElement('div');
        container.id = 'style-guide-text-styles';
        parent.appendChild(container);

        for (let i = 1; i <= 6; i++) {
            container.appendChild(createHeader(i));
        }
    }

    private createTextStyles(parent: HTMLElement) {
        const container = document.createElement('div');
        container.id = 'style-guide-text-styles';
        parent.appendChild(container);

        const p = document.createElement('p');
        p.textContent = 'Paragraph';
        container.appendChild(p);

        const strong = document.createElement('strong');
        strong.textContent = 'Strong';
        container.appendChild(strong);

        const em = document.createElement('em');
        em.textContent = 'Emphasis';
        container.appendChild(em);

        const code = document.createElement('code');
        code.textContent = 'Code';
        container.appendChild(code);

        const pre = document.createElement('pre');
        pre.textContent = 'Preformatted';
        container.appendChild(pre);

        const blockquote = document.createElement('blockquote');
        blockquote.textContent = 'Blockquote';
        container.appendChild(blockquote);

        const abbr = document.createElement('abbr');
        abbr.textContent = 'Abbreviation';
        abbr.title = 'Title';
        container.appendChild(abbr);

        const del = document.createElement('del');
        del.textContent = 'Deleted';
        container.appendChild(del);

        const ins = document.createElement('ins');
        ins.textContent = 'Inserted';
        container.appendChild(ins);

        const sub = document.createElement('sub');
        sub.textContent = 'Subscript';
        container.appendChild(sub);

        const sup = document.createElement('sup');
        sup.textContent = 'Superscript';
        container.appendChild(sup);

        const small = document.createElement('small');
        small.textContent = 'Small';
        container.appendChild(small);

        const mark = document.createElement('mark');
        mark.textContent = 'Mark';
        container.appendChild(mark);

        const time = document.createElement('time');
        time.textContent = 'Time';
        container.appendChild(time);

        const dfn = document.createElement('dfn');
        dfn.textContent = 'Definition';
        container.appendChild(dfn);

        const q = document.createElement('q');
        q.textContent = 'Quote';
        container.appendChild(q);

        const cite = document.createElement('cite');
        cite.textContent = 'Citation';
        container.appendChild(cite);

        const address = document.createElement('address');
        address.textContent = 'Address';
        container.appendChild(address);

        const s = document.createElement('s');
        s.textContent = 'Strikethrough';
        container.appendChild(s);

        const u = document.createElement('u');
        u.textContent = 'Underline';
        container.appendChild(u);

        const i = document.createElement('i');
        i.textContent = 'Italic';
        container.appendChild(i);

        const b = document.createElement('b');
        b.textContent = 'Bold';
        container.appendChild(b);

        const a = document.createElement('a');
        a.textContent = 'Anchor';
        a.href = '#';
        container.appendChild(a);

        const span = document.createElement('span');
        span.textContent = 'Span';
        container.appendChild(span);

        const ul = document.createElement('ul');
        container.appendChild(ul);

        const li1 = document.createElement('li');
        li1.textContent = 'Item 1 (list item)';
        ul.appendChild(li1);

        const li2 = document.createElement('li');
        li2.textContent = 'Item 2 (list item)';
        ul.appendChild(li2);

        const li3 = document.createElement('li');
        li3.textContent = 'Item 3 (list item)';
        ul.appendChild(li3);
    }

    private createColors() {
        const createColor = (color: string) => {
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.flexDirection = 'column';
            wrapper.style.alignItems = 'center';

            const div = document.createElement('div');
            div.id = 'style-guide-color';
            div.style.backgroundColor = `var(--${color})`;
            wrapper.appendChild(div);

            const name = document.createElement('small');
            name.textContent = color;
            wrapper.appendChild(name);

            return wrapper;
        };

        const container1 = document.createElement('div');
        container1.id = 'style-guide-color-container';
        this.main.appendChild(container1);

        container1.appendChild(createColor('background-l-3'));
        container1.appendChild(createColor('background-l-2'));
        container1.appendChild(createColor('background-l-1'));
        container1.appendChild(createColor('background-l-0'));
        ((container1.lastChild as HTMLElement).firstChild as HTMLElement).style.border = '1px solid var(--text-l-2)';


        const container2 = document.createElement('div');
        container2.id = 'style-guide-color-container';
        this.main.appendChild(container2);
        
        container2.appendChild(createColor('text-l-2'));
        container2.appendChild(createColor('text-l-1'));
        container2.appendChild(createColor('text-l-0'));
        ((container2.lastChild as HTMLElement).firstChild as HTMLElement).style.border = '1px solid var(--text-l-2)';

        const container3 = document.createElement('div');
        container3.id = 'style-guide-color-container';
        this.main.appendChild(container3);

        container3.appendChild(createColor('primary-l-8'));
        container3.appendChild(createColor('primary-l-7'));
        container3.appendChild(createColor('primary-l-6'));
        container3.appendChild(createColor('primary-l-5'));
        container3.appendChild(createColor('primary-l-4'));
        container3.appendChild(createColor('primary-l-3'));
        container3.appendChild(createColor('primary-l-2'));
        container3.appendChild(createColor('primary-l-1'));
        container3.appendChild(createColor('primary-l-0'));
    }

    private createButtons() {
        const buttonContainer = document.createElement('div');
        this.main.appendChild(buttonContainer);

        const enabledContainer = document.createElement('div');
        enabledContainer.id = 'style-guide-button-container';
        buttonContainer.appendChild(enabledContainer);

        const label = document.createElement('small');
        label.textContent = 'Enabled';
        label.style.width = '60px';
        enabledContainer.appendChild(label);
    
        const b1 = document.createElement('button');
        b1.className = 'button button-primary';
        b1.textContent = 'Primary';
        enabledContainer.appendChild(b1);

        const b2 = document.createElement('button');
        b2.className = 'button button-secondary';
        b2.textContent = 'Secondary';
        enabledContainer.appendChild(b2);

        const b3 = document.createElement('button');
        b3.className = 'button button-inverted';
        b3.textContent = 'Inverted';
        enabledContainer.appendChild(b3);

        const b4 = document.createElement('button');
        b4.className = 'button button-primary button-rounded';
        b4.innerHTML = ICON.ruler;
        enabledContainer.appendChild(b4);

        const b5 = document.createElement('button');
        b5.className = 'button button-secondary button-rounded';
        b5.innerHTML = ICON.books;
        enabledContainer.appendChild(b5);

        const b6 = document.createElement('button');
        b6.className = 'button button-inverted button-rounded';
        b6.innerHTML = ICON.night;
        enabledContainer.appendChild(b6);

        // ----------------------------

        const activeContainer = document.createElement('div');
        activeContainer.id = 'style-guide-button-container';
        buttonContainer.appendChild(activeContainer);

        const label2 = document.createElement('small');
        label2.textContent = 'Active';
        label2.style.width = '60px';
        activeContainer.appendChild(label2);

        const b1a = document.createElement('button');
        b1a.className = 'button button-primary';
        b1a.classList.add('active');
        b1a.textContent = 'Primary';
        activeContainer.appendChild(b1a);

        const b2a = document.createElement('button');
        b2a.className = 'button button-secondary';
        b2a.classList.add('active');
        b2a.textContent = 'Secondary';
        activeContainer.appendChild(b2a);

        const b3a = document.createElement('button');
        b3a.className = 'button button-inverted';
        b3a.classList.add('active');
        b3a.textContent = 'Inverted';
        activeContainer.appendChild(b3a);

        const b4a = document.createElement('button');
        b4a.className = 'button button-primary button-rounded';
        b4a.classList.add('active');
        b4a.innerHTML = ICON.ruler;
        activeContainer.appendChild(b4a);

        const b5a = document.createElement('button');
        b5a.className = 'button button-secondary button-rounded';
        b5a.classList.add('active');
        b5a.innerHTML = ICON.books;
        activeContainer.appendChild(b5a);

        const b6a = document.createElement('button');
        b6a.className = 'button button-inverted button-rounded';
        b6a.classList.add('active');
        b6a.innerHTML = ICON.night;
        activeContainer.appendChild(b6a);

        // ----------------------------

        const disabledContainer = document.createElement('div');
        disabledContainer.id = 'style-guide-button-container';
        buttonContainer.appendChild(disabledContainer);

        const label3 = document.createElement('small');
        label3.textContent = 'Disabled';
        label3.style.width = '60px';
        disabledContainer.appendChild(label3);

        const b1d = document.createElement('button');
        b1d.className = 'button button-primary';
        b1d.disabled = true;
        b1d.textContent = 'Primary';
        disabledContainer.appendChild(b1d);

        const b2d = document.createElement('button');
        b2d.className = 'button button-secondary';
        b2d.disabled = true;
        b2d.textContent = 'Secondary';
        disabledContainer.appendChild(b2d);

        const b3d = document.createElement('button');
        b3d.className = 'button button-inverted';
        b3d.disabled = true;
        b3d.textContent = 'Inverted';
        disabledContainer.appendChild(b3d);

        const b4d = document.createElement('button');
        b4d.className = 'button button-primary button-rounded';
        b4d.disabled = true;
        b4d.innerHTML = ICON.ruler;
        disabledContainer.appendChild(b4d);

        const b5d = document.createElement('button');
        b5d.className = 'button button-secondary button-rounded';
        b5d.disabled = true;
        b5d.innerHTML = ICON.books;
        disabledContainer.appendChild(b5d);

        const b6d = document.createElement('button');
        b6d.className = 'button button-inverted button-rounded';
        b6d.disabled = true;
        b6d.innerHTML = ICON.night;
        disabledContainer.appendChild(b6d);
    }

    private createScrollbars() {
        const container = document.createElement('div');
        container.id = 'style-guide-scrollbar-container';
        this.main.appendChild(container);

        const scrollbar = document.createElement('div');
        scrollbar.id = 'style-guide-scrollbar';
        container.appendChild(scrollbar);
    }


}