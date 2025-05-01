package com.projet.molarisse.email;

import lombok.Getter;

@Getter

public enum EmailTemplateName {

    ACTIVATE_ACCOUNT("activate_account")

    ;
    private final String prenom;
    EmailTemplateName(String prenom) {
        this.prenom = prenom;
    }


}
