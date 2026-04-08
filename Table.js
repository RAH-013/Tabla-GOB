class Table {
    constructor(options) {
        this.dataUrl = options.dataUrl;
        this.layoutUrl = options.layoutUrl;
        this.pageSize = options.pageSize || 6;
        this.defaultImage = options.defaultImage !== undefined ? options.defaultImage : null;

        this.currentPage = 1;
        this.data = [];
        this.filteredData = [];
        this.layout = null;
        this.currentQuery = "";

        this.elements = {
            loader: document.getElementById("gd-loader"),
            container: document.getElementById("gd-container"),
            searchInput: document.getElementById("gd-search"),
            clearBtn: document.getElementById("gd-clear"),
            list: document.getElementById("gd-directory"),
            rangeTxt: document.getElementById("gd-range"),
            prevBtn: document.getElementById("gd-prev"),
            nextBtn: document.getElementById("gd-next"),
            head: document.getElementById("gd-head"),
            info: document.getElementById("gd-info")
        };
    }

    async init() {
        try {
            const layoutRes = await fetch(this.layoutUrl);
            if (!layoutRes.ok) throw new Error("Directorio de configuración no disponible");
            this.layout = await layoutRes.json();

            await this.fetchData();

            this.elements.loader.remove();
            this.elements.container.classList.remove("visually-hidden");

            this.setupEventListeners();
            this.renderList();
        } catch (error) {
            console.error("Error al inicializar el directorio:", error);
        }
    }

    async fetchData() {
        const parseCSVLine = (line) => {
            const result = [];
            let current = "";
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    if (line[i + 1] === '"') {
                        current += '"';
                        i++;
                    } else {
                        inQuotes = !inQuotes;
                    }
                    continue;
                }
                if (char === ',' && !inQuotes) {
                    result.push(current.replace(/[\r\n]+/g, "").trim());
                    current = "";
                    continue;
                }
                current += char;
            }
            result.push(current.replace(/[\r\n]+/g, "").trim());
            return result;
        };

        const res = await fetch(this.dataUrl);
        if (!res.ok) throw new Error("Directorio no disponible");

        const text = await res.text();

        const lines = text.trim().split("\n");
        const headers = parseCSVLine(lines[0]);

        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            const obj = {};
            for (let j = 0; j < headers.length; j++) {
                obj[headers[j]] = values[j];
            }
            this.data.push(obj);
        }
    }

    setupEventListeners() {
        this.elements.prevBtn.onclick = () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderList();
            }
        };

        this.elements.nextBtn.onclick = () => {
            if (this.currentPage * this.pageSize < this.getSource().length) {
                this.currentPage++;
                this.renderList();
            }
        };

        this.elements.clearBtn.onclick = () => {
            this.elements.searchInput.value = "";
            this.filterData("");
            this.clearDetail();
            this.elements.searchInput.focus();
        };

        this.elements.searchInput.oninput = (e) => {
            this.filterData(e.target.value);
        };
    }

    getSource() {
        return this.currentQuery ? this.filteredData : this.data;
    }

    filterData(query) {
        this.currentQuery = query.toLowerCase().trim();

        if (!this.currentQuery) {
            this.filteredData = [];
        } else {
            this.filteredData = this.data.filter(item => {
                const values = Object.values(item)
                    .join(" ")
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "");
                return values.includes(this.currentQuery);
            });
        }

        this.currentPage = 1;
        this.renderList();
    }

    renderList() {
        const source = this.getSource();
        const totalPages = Math.ceil(source.length / this.pageSize) || 1;

        if (this.currentPage < 1) this.currentPage = 1;
        if (this.currentPage > totalPages) this.currentPage = totalPages;

        const start = (this.currentPage - 1) * this.pageSize;
        const pageItems = source.slice(start, start + this.pageSize);

        this.elements.list.innerHTML = "";

        const { titleKey, subtitleKey, imageKey } = this.layout.list;

        pageItems.forEach(item => {
            const a = document.createElement("a");
            a.className = "list-group-item list-group-item-action list-group-item-light d-flex align-items-center gap-3 py-2";

            const photo = item[imageKey] || this.defaultImage;
            const title = this.highlight(item[titleKey] || "", this.currentQuery);
            const subtitle = this.highlight(item[subtitleKey] || "", this.currentQuery);

            const imgHtml = photo ? `<img src="${photo}" width="40" class="rounded">` : "";

            a.innerHTML = `
                ${imgHtml}
                <div>
                    <div style="cursor:default;">${subtitle}</div>
                    <small style="cursor:default;" class="text-muted">${title}</small>
                </div>
            `;

            a.onclick = () => this.showDetail(item);
            this.elements.list.appendChild(a);
        });

        this.elements.rangeTxt.textContent = `Página ${this.currentPage} de ${totalPages}`;

        if (source.length > 0) {
            this.showDetail(source[0]);
            this.elements.prevBtn.disabled = this.currentPage === 1;
            this.elements.nextBtn.disabled = this.currentPage === totalPages;
        } else {
            this.elements.prevBtn.disabled = true;
            this.elements.nextBtn.disabled = true;
        }
    }

    showDetail(item) {
        const headCfg = this.layout.header;
        const headImg = item[headCfg.imageKey] || this.defaultImage;
        const headTitle = this.highlight(item[headCfg.titleKey] || "No especificado", this.currentQuery);
        const headSubtitle = this.highlight(item[headCfg.subtitleKey] || "No especificado", this.currentQuery);

        const imgHtml = headImg ? `<img class="rounded-circle object-fit-cover mb-3" style="width: 100px; aspect-ratio:1/1;" src="${headImg}">` : "";

        this.elements.head.innerHTML = `
            ${imgHtml}
            <h5>${headTitle}</h5>
            <p>
                <strong>${headCfg.subtitleLabel}</strong>
                <span>${headSubtitle}</span>
            </p>
        `;

        const tabsCfg = this.layout.tabs;

        let navHtml = `<ul class="nav nav-tabs w-100" role="tablist">`;
        tabsCfg.forEach((tab, index) => {
            const isActive = index === 0 ? "active" : "";
            navHtml += `
                <li class="nav-item flex-fill text-center" role="presentation">
                    <button class="nav-link ${isActive} w-100" data-bs-toggle="tab" data-bs-target="#${tab.id}" type="button" role="tab">
                        ${tab.title}
                    </button>
                </li>
            `;
        });
        navHtml += `</ul>`;

        let contentHtml = `<div class="tab-content p-3 border border-top-0 flex-grow-1">`;
        tabsCfg.forEach((tab, index) => {
            const isActive = index === 0 ? "show active" : "";
            contentHtml += `<div class="tab-pane fade ${isActive}" id="${tab.id}" role="tabpanel">`;

            // Revertido al diseño de lista original con mb-2
            contentHtml += `<ul class="list-unstyled mb-0">`;

            tab.fields.forEach(field => {
                const rawValue = item[field.key];
                let displayValue = this.highlight(rawValue || "No especificado", this.currentQuery);

                if (field.type === "link") {
                    if (rawValue) {
                        displayValue = `<a href="${rawValue}" target="_blank" class="btn btn-sm btn-outline-danger">
                                            <i class="bi bi-file-pdf"></i> ${field.linkLabel || "Ver archivo PDF adicional"}
                                        </a>`;
                    } else {
                        displayValue = `<span class="text-muted">No hay archivos adicionales disponibles.</span>`;
                    }
                } else if (field.key === "NOMBRES" && rawValue) {
                    // Lógica específica para mantener el estilo de separación de nombres si existe
                    displayValue = rawValue.split(",")
                        .map(name => name.trim())
                        .filter(Boolean)
                        .map(name => `<span>${this.highlight(name, this.currentQuery)}</span>`)
                        .join(" ") || "<span>No especificado</span>";
                }

                contentHtml += `
                    <li class="d-flex flex-column mb-2">
                        <span class="fw-bold me-2">${field.label}</span>
                        ${field.type === "link" ? `<div>${displayValue}</div>` : `<span>${displayValue}</span>`}
                    </li>
                `;
            });

            contentHtml += `</ul></div>`;
        });
        contentHtml += `</div>`;

        this.elements.info.innerHTML = navHtml + contentHtml;
    }

    clearDetail() {
        this.elements.head.innerHTML = "<strong>Selecciona un elemento para mostrar mas información.</strong>";
        this.elements.info.innerHTML = "";
    }

    highlight(text, query) {
        const safeText = this.escapeHTML(text);
        if (!query) return safeText;
        const regex = new RegExp(`(${this.escapeHTML(query)})`, "gi");
        return safeText.replace(regex, "<mark class='bg-warning text-dark'>$1</mark>");
    }

    escapeHTML(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}