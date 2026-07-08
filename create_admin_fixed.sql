-- Crear rol ADMIN
INSERT INTO roles (id, name, description, "isSystem", "isActive", createdAt, updatedAt) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440000', 
    'ADMIN', 
    'Administrador del sistema', 
    true, 
    true, 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
);

-- Crear usuario admin
INSERT INTO users (id, email, "firstName", "lastName", password, roleId, "isActive", createdAt, updatedAt) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440001', 
    'admin@sigah.com', 
    'Admin', 
    'Sistema', 
    '$2a$10$QWZJ5kgFarKw2JhPnzL9Wew78YTdvg74J7tHEebOytFQBoxDL.f82', 
    '550e8400-e29b-41d4-a716-446655440000', 
    true, 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
);
