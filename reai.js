// Numero de elementos maximos por pagina.
const reaiPageSize = 6;

// Indice de la pagina actual.
let reaiCurrentPage = 1

// Array de objetos del excel.
let reaiData = [];

// Array de objetos del excel filtrados.
let reaiFilteredData = [];

// Imagen por defecto para aquellos que no tienen una.
const reaiDefaultImage = "https://admiweb.col.gob.mx/archivos_prensa/banco_img/file_677d5dd35f29d_Logotipo_tipografico_rectangular_minimalista_blanco_y_negro.png";

// Obtiene los datos del excel y los convierte en array de objetos.
const reaiTableGetData = async (path) => {
    const parseCSVLine = (line) => {
        const result = []
        let current = ""
        let inQuotes = false

        for (let i = 0; i < line.length; i++) {
            const char = line[i]

            if (char === '"') {
                if (line[i + 1] === '"') {
                    current += '"'
                    i++
                } else {
                    inQuotes = !inQuotes
                }
                continue
            }

            if (char === ',' && !inQuotes) {
                result.push(current.replace(/[\r\n]+/g, "").trim())
                current = ""
                continue
            }

            current += char
        }

        result.push(current.replace(/[\r\n]+/g, "").trim())
        return result
    }

    try {
        const res = await fetch(path)
        if (!res.ok) throw new Error("Directorio no disponible")

        const lines = (await res.text()).trim().split("\n")
        const headers = parseCSVLine(lines[0])

        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i])
            const obj = {}

            for (let j = 0; j < headers.length; j++) {
                obj[headers[j]] = values[j]
            }

            reaiData.push(obj)
        }
    } catch (error) {
        console.error("Error al obtener datos:", error)
    }
}

// Muestra la lista de REAI, filtra mediante el buscador y controla la paginación.
const reaiRenderList = () => {
    const query = document.getElementById("reai-search").value.trim();
    const source = query ? reaiFilteredData : reaiData;

    const totalPages = Math.ceil(source.length / reaiPageSize);
    if (reaiCurrentPage < 1) reaiCurrentPage = 1;
    if (reaiCurrentPage > totalPages) reaiCurrentPage = totalPages;

    const start = (reaiCurrentPage - 1) * reaiPageSize;
    const end = start + reaiPageSize;
    const page = source.slice(start, end);

    const list = document.getElementById("reai-directory");
    list.innerHTML = "";

    page.forEach(item => {
        const a = document.createElement("a");
        a.className = "list-group-item list-group-item-action list-group-item-light d-flex align-items-center gap-3 py-2";

        const photo = item.LOGOTIPO || reaiDefaultImage;
        const folio = reaiHighLight(item.FOLIO || "", query);
        const name = reaiHighLight(item.EMPRESA || "", query);

        a.innerHTML = `
            <img src="${photo}" width="40" class="rounded">
            <div>
                <div style="cursor:default;">${folio}</div>
                <small style="cursor:default;" class="text-muted">${name}</small>
            </div>
        `;

        a.onclick = () => reaiElementShowDetail(item);
        list.appendChild(a);
    });

    document.getElementById("reai-range").textContent =
        `Página ${reaiCurrentPage} de ${totalPages}`;

    const prevBtn = document.getElementById("reai-prev");
    const nextBtn = document.getElementById("reai-next");

    if (source.length > 0) {
        reaiElementShowDetail(source[0]);
        prevBtn.disabled = reaiCurrentPage === 1;
        nextBtn.disabled = reaiCurrentPage === totalPages;
    } else {
        prevBtn.disabled = true;
        nextBtn.disabled = true;
    }
};

// Muestra la información del elemento.
const reaiElementShowDetail = (element) => {
    const query = document.getElementById("reai-search").value.trim();

    const tradeName = reaiHighLight(element.EMPRESA, query) || "No especificado";
    const legalRepresentative = reaiHighLight(element.REPRESENTANTE, query) || "No especificado";
    const delivery = reaiHighLight(element.ENTREGA, query) || "No especificado";
    const validity = reaiHighLight(element.VIGENCIA, query) || "No especificado";
    const address = reaiHighLight(element.DOMICILIO, query) || "No especificado";
    const municipality = reaiHighLight(element.MUNICIPIO, query) || "No especificado";
    const complaints = reaiHighLight(element.DENUNCIAS, query) || "No especificado";
    const pdfUrl = reaiHighLight(element.ADICIONAL);

    const names = (element.NOMBRES || "")
        .split(",")
        .map(name => name.trim())
        .filter(Boolean)
        .map(name => `<span>${reaiHighLight(name, query)}</span>`)
        .join(" ") || "<span>No especificado</span>";


    document.getElementById("reai-head").innerHTML = `
        <img class="rounded-circle object-fit-cover mb-3" style="width: 100px; aspect-ratio:1/1;" src="${element.LOGOTIPO || reaiDefaultImage}">

        <h5>${tradeName}</h5>

        <p>
            <strong>Representate Legal:</strong>
            <span>${legalRepresentative}</span>
        </p>
    `;

    document.getElementById("reai-info").innerHTML = `
    <ul class="nav nav-tabs w-100" role="tablist">
        <li class="nav-item flex-fill text-center" role="presentation">
            <button class="nav-link active w-100" data-bs-toggle="tab" data-bs-target="#tab1" type="button" role="tab">
                General
            </button>
        </li>
        <li class="nav-item flex-fill text-center" role="presentation">
            <button class="nav-link w-100" data-bs-toggle="tab" data-bs-target="#tab2" type="button" role="tab">
                Información Domiciliaria
            </button>
        </li>
        <li class="nav-item flex-fill text-center" role="presentation">
            <button class="nav-link w-100" data-bs-toggle="tab" data-bs-target="#tab3" type="button" role="tab">
                Información Adicional
            </button>
        </li>
    </ul>

    <div class="tab-content p-3 border border-top-0 flex-grow-1">

        <div class="tab-pane fade show active" id="tab1" role="tabpanel">
            <ul class="list-unstyled mb-0">
                <li class="d-flex flex-column mb-2">
                    <span class="fw-bold me-2">Asesores:</span>
                    ${names}
                </li>
                <li class="d-flex flex-column mb-2">
                    <span class="fw-bold me-2">Fecha Inicio:</span>
                    <span>${delivery}</span>
                </li>
                <li class="d-flex flex-column mb-2">
                    <span class="fw-bold me-2">Fecha Vencimiento:</span>
                    <span>${validity}</span>
                </li>
            </ul>
        </div>

        <div class="tab-pane fade" id="tab2" role="tabpanel">
            <ul class="list-unstyled mb-0">
                <li class="d-flex flex-column mb-2">
                    <span class="fw-bold me-2">Dirección:</span>
                    <span>${address}</span>
                </li>
                <li class="d-flex flex-column mb-2">
                    <span class="fw-bold me-2">Municipio:</span>
                    <span>${municipality}</span>
                </li>
            </ul>
        </div>
        <div class="tab-pane fade" id="tab3" role="tabpanel">
            <div class="mb-3">
                <h6 class="fw-bold">Quejas y Denuncias:</h6>
                <p>${complaints}</p>
            </div>
            <hr>
            <div>
                <h6 class="fw-bold">Documentación:</h6>
                ${pdfUrl 
                    ? `<a href="${pdfUrl}" target="_blank" class="btn btn-sm btn-outline-danger">
                        <i class="bi bi-file-pdf"></i> Ver archivo PDF adicional
                       </a>` 
                    : '<span class="text-muted">No hay archivos adicionales disponibles.</span>'
                }
            </div>
        </div>
    </div>
    `;
}

// Limpia la sección de información.
const reaiElementClearDetail = () => {
    document.getElementById("reai-head").innerHTML = "<strong>Selecciona un elemento para mostrar mas información.</strong>";
    document.getElementById("reai-info").innerHTML = "";
}

// Resalta texto mediante el filtro.
const reaiHighLight = (text, query) => {
    if (!query) return reaiEscapeHTML(text)
    const safe = reaiEscapeHTML(text)
    const regex = new RegExp(`(${query})`, "gi")
    return safe.replace(regex, "<mark class='bg-warning text-dark'>$1</mark>")
}

// Evita que el navegador interprete como codigo.
const reaiEscapeHTML = str => {
    if (!str) return ""
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
}

const reaiFilterData = (query) => {
    const term = query.toLowerCase().trim();

    const filtered = reaiData.filter(item => {
        const values = Object.values(item)
            .join(" ")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
        return values.includes(term);
    });

    reaiFilteredData.length = 0;
    reaiFilteredData.push(...filtered);

    reaiCurrentPage = 1;
    reaiRenderList();
};

document.addEventListener("DOMContentLoaded", async () => {
    const loader = document.getElementById("reai-loader");
    const input = document.getElementById("reai-search");

    await reaiTableGetData("https://docs.google.com/spreadsheets/d/e/2PACX-1vSK4NHbhsWLDz91B7Qszcypuz6xK7Jm2ueyFqsGAeSL6x1mUwu6jcdevKcbRJiJFmL-sz7Se0HAB0Dp/pub?gid=622727575&single=true&output=csv").then(d => {
        loader.remove();
        document.getElementById("reai-container").classList.remove("visually-hidden");
        reaiRenderList();
    })

    document.getElementById("reai-prev").onclick = () => {
        if (reaiCurrentPage > 1) {
            reaiCurrentPage--;
            reaiRenderList();
        }
    }

    document.getElementById("reai-next").onclick = () => {
        if (reaiCurrentPage * reaiPageSize < reaiData.length) {
            reaiCurrentPage++;
            reaiRenderList();
        }
    }

    document.getElementById("reai-clear").onclick = () => {
        input.value = "";
        reaiFilteredData = [];
        reaiCurrentPage = 1;

        reaiRenderList();
        reaiElementClearDetail();
        input.focus();
    }

    input.oninput = (e) => {
        reaiFilterData(e.target.value);
    }
})