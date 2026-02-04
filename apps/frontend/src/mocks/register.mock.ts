
const collegeOptions = [
    "FACE",
    "FCA",
    "FCBA",
    "FACET",
    "FCH",
    "FCS",
    "FALE",
    "FADIR",
    "FAED",
    "FAEN"
]
const courseOptions = {
    "options": [
        [
            "Administração",
            "Ciências Contábeis",
            "Ciências Econômicas"
        ],
        [
            "Agronomia",
            "Engenharia Agrícola",
            "Engenharia de Aquicultura",
            "Zootecnia"
        ],
        [
            "Biotecnologia",
            "Ciências Biológicas - Bacharelado",
            "Ciências Biológicas - Licenciatura",
            "Gestão Ambiental"
        ],
        [
            "Engenharia de Computação",
            "Física",
            "Matemática",
            "Química - Bacharelado",
            "Química - Licenciatura",
            "Sistemas de Informação"
        ],
        [
            "Ciências Sociais",
            "Geografia",
            "História",
            "Psicologia"
        ],
        [
            "Medicina",
            "Nutrição"
        ],
        [
            "Artes Cênicas",
            "Letras"
        ],
        [
            "Direito",
            "Relações Internacionais"
        ],
        [
            "Educação Física",
            "Pedagogia"
        ],
        [
            "Engenharia de Alimentos",
            "Engenharia de Energia",
            "Engenharia de Produção",
            "Engenharia Civil",
            "Engenharia Mecânica"
        ]
    ]
}

export const COURSE_GROUPED_MOCK = courseOptions.options.map((courses, index) => ({
    college: collegeOptions[index],
    courses: courses
}));

export const COURSE_MOCK = courseOptions.options.flat();