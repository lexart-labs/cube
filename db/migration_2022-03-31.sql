
ALTER TABLE levels
  ADD COLUMN idCompany NOT NULL INT(11) DEFAULT(1),
  ADD CONSTRAINT  fk_id_companies_levels FOREIGN KEY (idCompany) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE levels
  ADD COLUMN idCareerType NOT NULL INT(11) DEFAULT(1),
  ADD CONSTRAINT fk_id_levels_career_type FOREIGN KEY (idCareerType) REFERENCES careers_type(id) ON DELETE CASCADE;