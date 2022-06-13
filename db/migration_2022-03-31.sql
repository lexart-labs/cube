
ALTER TABLE levels
  ADD COLUMN idCompany INT(11) NOT NULL DEFAULT(1),
  ADD CONSTRAINT  fk_id_companies_levels FOREIGN KEY (idCompany) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE levels
  ADD COLUMN idCareerType INT(11) NOT NULL DEFAULT(1),
  ADD CONSTRAINT fk_id_levels_career_type FOREIGN KEY (idCareerType) REFERENCES careers_type(id) ON DELETE CASCADE;

ALTER TABLE levels 
  ADD CONSTRAINT uk_levels UNIQUE (level, idCompany, idCareerType);