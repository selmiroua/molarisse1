package com.projet.molarisse.service;

import com.projet.molarisse.config.FileStorageConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path fileStorageLocation;

    @Autowired
    public FileStorageService(FileStorageConfig fileStorageConfig) {
        this.fileStorageLocation = Paths.get(fileStorageConfig.getUploadDir())
                .toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (IOException ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    /**
     * Stocke le fichier dans le répertoire racine de stockage
     */
    public String storeFile(MultipartFile file) {
        return storeFile(file, null);
    }

    /**
     * Stocke le fichier dans un sous-répertoire spécifique
     * @param file Le fichier à stocker
     * @param subDirectory Le sous-répertoire (null pour le répertoire racine)
     * @return Le nom du fichier stocké
     */
    public String storeFile(MultipartFile file, String subDirectory) {
        // Normalize file name
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        
        try {
            // Check if the file's name contains invalid characters
            if (originalFileName.contains("..")) {
                throw new RuntimeException("Sorry! Filename contains invalid path sequence " + originalFileName);
            }

            // Generate unique filename
            String fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            String newFileName = UUID.randomUUID().toString() + fileExtension;

            // Create subdirectory if needed
            Path targetLocation;
            if (subDirectory != null && !subDirectory.isEmpty()) {
                Path subDirectoryPath = this.fileStorageLocation.resolve(subDirectory);
                Files.createDirectories(subDirectoryPath);
                targetLocation = subDirectoryPath.resolve(newFileName);
                // Return path with subdirectory for database storage
                newFileName = subDirectory + "/" + newFileName;
            } else {
                targetLocation = this.fileStorageLocation.resolve(newFileName);
            }

            // Copy file to the target location
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return newFileName;
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + originalFileName + ". Please try again!", ex);
        }
    }

    public Resource loadFileAsResource(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            System.out.println("Looking for file at: " + filePath.toAbsolutePath());
            
            // Check if the file exists
            if (!Files.exists(filePath)) {
                System.err.println("File not found: " + filePath.toAbsolutePath());
                
                // Check if the directory exists
                Path parentDir = filePath.getParent();
                if (Files.exists(parentDir)) {
                    System.out.println("Directory exists: " + parentDir);
                    System.out.println("Files in directory:");
                    Files.list(parentDir).forEach(file -> System.out.println("  - " + file.getFileName()));
                } else {
                    System.err.println("Directory does not exist: " + parentDir);
                }
                
                throw new RuntimeException("File not found " + fileName);
            }
            
            // Check if the file is readable
            if (!Files.isReadable(filePath)) {
                System.err.println("File is not readable: " + filePath.toAbsolutePath());
                throw new RuntimeException("File is not readable " + fileName);
            }
            
            Resource resource = new UrlResource(filePath.toUri());
            if(resource.exists() && resource.isReadable()) {
                System.out.println("File found and readable: " + filePath.toAbsolutePath());
                return resource;
            } else {
                System.err.println("File exists but is not readable as a resource: " + filePath.toAbsolutePath());
                throw new RuntimeException("File not readable as resource " + fileName);
            }
        } catch (MalformedURLException ex) {
            System.err.println("Malformed URL: " + ex.getMessage());
            throw new RuntimeException("File not found " + fileName, ex);
        } catch (IOException ex) {
            System.err.println("IO Exception: " + ex.getMessage());
            throw new RuntimeException("IO error accessing file " + fileName, ex);
        }
    }

    public void deleteFile(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            throw new RuntimeException("Could not delete file " + fileName, ex);
        }
    }
}
