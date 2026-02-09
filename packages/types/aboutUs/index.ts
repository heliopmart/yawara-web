import {Nuclei, Nuclei_config, Team, Users} from '../'

// --------------------------------------------
// ----------- FRONTEND INTERFACES ------------
// --------------------------------------------

export interface AboutUsData {
    nuclei: {
        id: Nuclei['id'];
        name: Nuclei['name'];   
        total_members: Nuclei_config['total_members'];
        open_vacancies: Nuclei_config['open_vacancies'];
    }[];
    members: {
        name: Users['name'];
        role: Team['role'];
    }[];
}